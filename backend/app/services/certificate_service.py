"""
PDF certificate generation for verified claims.

Produces a premium, enterprise-grade verification certificate matching
the reference design — decorative borders, dark green section headers,
icons, confidence progress bar, circular seal, and QR code.
Fits on a single A4 page.
"""

from __future__ import annotations

import io
import math
from datetime import datetime, timezone
from pathlib import Path

import qrcode
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_CENTER, TA_LEFT

from app.core.errors import not_found
from app.utils.helpers import placeholder_tx_hash


# ── Color Palette ──────────────────────────────────────────────
C_GREEN = colors.HexColor("#064e3b")
C_NAVY = colors.HexColor("#0f172a")
C_GOLD = colors.HexColor("#c9a84c")
C_GOLD_LT = colors.HexColor("#e8d5a3")
C_GRAY = colors.HexColor("#e2e8f0")
C_TEXT = colors.HexColor("#334155")
C_TEXT_LT = colors.HexColor("#64748b")
C_WHITE = colors.white

STATUS_CLR = {
    "Verified": colors.HexColor("#10b981"),
    "Likely Verified": colors.HexColor("#3b82f6"),
    "Needs Review": colors.HexColor("#f59e0b"),
    "Rejected": colors.HexColor("#ef4444"),
    "Confirmed": colors.HexColor("#10b981"),
    "Pending": colors.HexColor("#f59e0b"),
}

# ── Icons (Unicode) ────────────────────────────────────────────
I_SHIELD = "\u26E8"
I_DOC = "\u2637"
I_TREE = "\u2663"
I_CHART = "\u2261"
I_HASH = "#"
I_CAL = "\u229E"
I_CLOCK = "\u25F7"
I_BRAIN = "\u25C9"
I_LEAF = "\u2662"
I_WARN = "\u26A0"
I_STAR = "\u2606"
I_LINK = "\u2295"
I_ETH = "\u25C6"
I_PERSON = "\u25CB"
I_ANCHOR = "\u2693"
I_PEN = "\u270E"


class CertificateService:
    """Builds premium single-page A4 PDF verification certificates."""

    def __init__(self):
        self.logo_path = Path(__file__).parent.parent.parent.parent / "public" / "logo.svg"

    # ── Public API ─────────────────────────────────────────────

    def generate(self, claim: dict) -> tuple[bytes, str]:
        if not claim:
            raise not_found("Claim")

        claim_id = claim.get("claim_id") or claim.get("id") or "UNKNOWN"
        claim_code = claim.get("claim_code") or claim_id
        filename = f"VisionLedger-Certificate-{claim_code}.pdf"
        buf = io.BytesIO()

        pw, ph = A4
        margin = 0.55 * cm          # tight margins for max content

        doc = SimpleDocTemplate(
            buf, pagesize=A4,
            rightMargin=margin, leftMargin=margin,
            topMargin=margin, bottomMargin=margin,
            title=f"Verification Certificate — {claim_id}",
            author="VisionLedger",
        )

        styles = getSampleStyleSheet()
        data = self._parse_claim(claim, claim_id, claim_code)

        story = self._build_story(data, styles, pw, margin)

        doc.build(
            story,
            onFirstPage=lambda c, d: self._draw_frame(c, d, pw, ph),
            onLaterPages=lambda c, d: self._draw_frame(c, d, pw, ph),
        )
        buf.seek(0)
        return buf.read(), filename

    # ── Data Parsing ───────────────────────────────────────────

    def _parse_claim(self, claim, claim_id, claim_code):
        issued_at = datetime.now(timezone.utc)
        tx_hash = claim.get("transaction_hash") or claim.get("tx_hash") or placeholder_tx_hash(str(claim_code))
        if tx_hash and not tx_hash.startswith("0x") and len(tx_hash) == 64:
            tx_hash = "0x" + tx_hash

        v_hash = claim.get("blockchain_hash") or "\u2014"
        block_num = claim.get("block_number")
        block_txt = f"#{block_num}" if block_num else "N/A"
        network = claim.get("network") or "Ethereum Sepolia"
        contract = claim.get("contract_address") or "\u2014"
        bc_status = claim.get("blockchain_status") or "Pending"

        explorer = ""
        if tx_hash and tx_hash.startswith("0x") and len(tx_hash) == 66:
            explorer = f"https://sepolia.etherscan.io/tx/{tx_hash}"

        vision_conf = claim.get("vision_confidence") or 0
        match_conf = claim.get("claim_match_confidence") or 0
        verify_conf = claim.get("verification_confidence") or 0

        objects = claim.get("objects_detected") or []
        if isinstance(objects, str):
            objects = [objects]
        obj_list = []
        if objects and isinstance(objects[0], dict):
            obj_list = [(o.get("label", "?"), o.get("confidence", 0)) for o in objects]
        else:
            obj_list = [(o, 0) for o in objects] if objects else []

        confidence = float(claim.get("confidence") or 0.0)
        status = claim.get("status") or "Unknown"
        claim_type = claim.get("claim_type_label") or claim.get("claim_type") or "unknown"
        if "_" in claim_type:
            claim_type = claim_type.replace("_", " ").title()

        reason = claim.get("reason") or "\u2014"
        limitations = claim.get("limitations") or "\u2014"
        recommendation = claim.get("recommendation") or "\u2014"
        est_qty = claim.get("estimated_quantity")
        qty_txt = str(est_qty) if est_qty is not None else "N/A"

        return dict(
            issued_at=issued_at, tx_hash=tx_hash, v_hash=v_hash,
            block_txt=block_txt, network=network, contract=contract,
            bc_status=bc_status, explorer=explorer,
            vision_conf=vision_conf, match_conf=match_conf,
            verify_conf=verify_conf, obj_list=obj_list,
            confidence=confidence, status=status, claim_type=claim_type,
            reason=reason, limitations=limitations,
            recommendation=recommendation, qty_txt=qty_txt,
            claim_id=claim_id, claim_code=claim_code,
        )

    # ── Story Builder ──────────────────────────────────────────

    def _build_story(self, d, styles, pw, margin):
        cw = pw - 2 * margin   # content width

        # ── Styles ──
        s_title = ParagraphStyle("T", parent=styles["Normal"],
            fontSize=22, textColor=C_GREEN, alignment=TA_CENTER,
            fontName="Helvetica-Bold", spaceAfter=2, leading=26)
        s_sub = ParagraphStyle("S", parent=styles["Normal"],
            fontSize=8, textColor=C_TEXT_LT, alignment=TA_CENTER,
            fontName="Helvetica", spaceAfter=6, leading=10)
        s_stmt = ParagraphStyle("St", parent=styles["Normal"],
            fontSize=7.5, textColor=C_TEXT, alignment=TA_CENTER,
            fontName="Helvetica", leading=11, spaceAfter=6)
        s_body = ParagraphStyle("B", parent=styles["Normal"],
            fontSize=7, leading=9.5, textColor=C_TEXT, fontName="Helvetica")
        s_lbl = ParagraphStyle("L", parent=s_body,
            fontName="Helvetica", fontSize=6.8, textColor=C_TEXT)
        s_lblB = ParagraphStyle("LB", parent=s_lbl, fontName="Helvetica-Bold")
        s_val = ParagraphStyle("V", parent=s_body,
            fontSize=6.8, textColor=C_NAVY, fontName="Helvetica")
        s_mono = ParagraphStyle("M", parent=s_val,
            fontName="Courier", fontSize=5.8, wordWrap="CJK")
        s_badge = ParagraphStyle("Bg", parent=s_body, fontSize=6.8, fontName="Helvetica-Bold")
        s_footer = ParagraphStyle("F", parent=s_body,
            fontSize=6.5, textColor=C_TEXT_LT, alignment=TA_CENTER, leading=9)

        story = []

        # ── Header ──
        try:
            if self.logo_path.exists():
                from svglib.svglib import svg2rlg
                logo = svg2rlg(str(self.logo_path))
                if logo:
                    sc = 70 / logo.width
                    logo.width *= sc; logo.height *= sc
                    lt = Table([[logo]], colWidths=[cw])
                    lt.setStyle(TableStyle([("ALIGN", (0,0), (-1,-1), "CENTER")]))
                    story.append(lt)
        except Exception:
            pass

        story.append(Paragraph("VisionLedger", ParagraphStyle(
            "LT", parent=styles["Normal"], fontSize=15,
            textColor=C_GREEN, fontName="Helvetica-Bold",
            alignment=TA_CENTER, spaceAfter=1, leading=18)))
        story.append(Paragraph(
            "AI-Powered Environmental Verification Platform", s_sub))

        story.append(Paragraph("CERTIFICATE OF VERIFICATION", s_title))

        # Gold divider
        div = Table([["", "\u2740", ""]], colWidths=[cw*0.42, cw*0.16, cw*0.42])
        div.setStyle(TableStyle([
            ("LINEBELOW", (0,0), (0,0), 0.8, C_GOLD),
            ("LINEBELOW", (2,0), (2,0), 0.8, C_GOLD),
            ("ALIGN", (1,0), (1,0), "CENTER"),
            ("TEXTCOLOR", (1,0), (1,0), C_GOLD),
            ("FONTSIZE", (1,0), (1,0), 10),
            ("TOPPADDING", (0,0), (-1,-1), 1),
            ("BOTTOMPADDING", (0,0), (-1,-1), 1),
        ]))
        story.append(div)
        story.append(Spacer(1, 0.15 * cm))

        story.append(Paragraph(
            "This certificate confirms that the submitted evidence has been analyzed using "
            "VisionLedger\u2019s AI verification engine and permanently anchored on the Ethereum "
            "Sepolia blockchain.", s_stmt))
        story.append(Spacer(1, 0.2 * cm))

        # ── Two-Column: Cert Info + AI Summary ──
        gap = 0.3 * cm
        col_w = (cw - gap) / 2

        cert_section = self._cert_info_table(d, s_lbl, s_lblB, s_val, s_mono, s_badge, col_w)
        ai_section = self._ai_summary_table(d, s_body, s_lblB, s_val, col_w)

        two_col = Table([[cert_section, ai_section]], colWidths=[col_w, col_w])
        two_col.setStyle(TableStyle([
            ("VALIGN", (0,0), (-1,-1), "TOP"),
        ]))
        story.append(two_col)
        story.append(Spacer(1, 0.25 * cm))

        # ── Blockchain Verification ──
        story.append(self._blockchain_section(d, s_lbl, s_lblB, s_val, s_mono, s_badge, cw))
        story.append(Spacer(1, 0.2 * cm))

        # ── Digital Signature ──
        story.append(self._signature_section(d, s_lbl, s_lblB, s_val, s_badge, cw))
        story.append(Spacer(1, 0.25 * cm))

        # ── Footer ──
        gold_line = Table([[""]], colWidths=[cw])
        gold_line.setStyle(TableStyle([
            ("LINEBELOW", (0,0), (-1,0), 1.2, C_GOLD),
            ("TOPPADDING", (0,0), (-1,-1), 0),
            ("BOTTOMPADDING", (0,0), (-1,-1), 3),
        ]))
        story.append(gold_line)

        story.append(Paragraph(
            f'<font color="{C_GOLD.hexval()}" size="11">{I_SHIELD}</font>',
            ParagraphStyle("FI", parent=s_body, alignment=TA_CENTER)))

        story.append(Paragraph(
            "This certificate has been automatically generated by VisionLedger and "
            "cryptographically secured using Ethereum blockchain technology.", s_footer))
        story.append(Spacer(1, 0.08 * cm))

        badges = (
            f'<font name="Helvetica-Bold" color="{C_GREEN.hexval()}">VisionLedger</font>'
            f'  <font color="{C_GOLD.hexval()}">\u2022</font>  '
            f'<font name="Helvetica-Bold" color="{C_GREEN.hexval()}">AI Verified</font>'
            f'  <font color="{C_GOLD.hexval()}">\u2022</font>  '
            f'<font name="Helvetica-Bold" color="{C_GREEN.hexval()}">Blockchain Anchored</font>'
            f'  <font color="{C_GOLD.hexval()}">\u2022</font>  '
            f'<font name="Helvetica-Bold" color="{C_GREEN.hexval()}">Tamper Resistant</font>'
        )
        story.append(Paragraph(badges, ParagraphStyle(
            "Badges", parent=s_footer, fontSize=7, leading=9)))

        return story

    # ── Section Builders ───────────────────────────────────────

    def _section_box(self, title, content, width):
        hdr = Paragraph(f"{I_SHIELD}  {title}", ParagraphStyle(
            "SH", parent=ParagraphStyle("t"),
            fontSize=8.5, textColor=C_WHITE,
            fontName="Helvetica-Bold", leading=11, leftIndent=4))
        hdr_tbl = Table([[hdr]], colWidths=[width], rowHeights=[0.42 * cm])
        hdr_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), C_GREEN),
            ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
            ("TOPPADDING", (0,0), (-1,-1), 0),
            ("BOTTOMPADDING", (0,0), (-1,-1), 0),
        ]))
        wrap = Table([[content]], colWidths=[width])
        wrap.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), C_WHITE),
            ("BOX", (0,0), (-1,-1), 0.5, C_GRAY),
            ("TOPPADDING", (0,0), (-1,-1), 0),
            ("BOTTOMPADDING", (0,0), (-1,-1), 0),
        ]))
        combined = Table([[hdr_tbl], [wrap]], colWidths=[width])
        combined.setStyle(TableStyle([
            ("TOPPADDING", (0,0), (-1,-1), 0),
            ("BOTTOMPADDING", (0,0), (-1,-1), 0),
        ]))
        return combined

    def _icon_cell(self, icon):
        return Paragraph(
            f'<font color="{C_GREEN.hexval()}" size="8">{icon}</font>',
            ParagraphStyle("IC", parent=ParagraphStyle("t"), alignment=TA_CENTER))

    def _status_badge(self, status):
        clr = STATUS_CLR.get(status, colors.HexColor("#64748b"))
        chk = "\u2713" if status in ("Verified", "Confirmed") else ""
        html = (
            f'<font color="{clr.hexval()}" size="7">{chk}</font> '
            f'<font name="Helvetica-Bold" size="6.8" color="{clr.hexval()}">{status}</font>')
        return Paragraph(html, ParagraphStyle("SB", parent=ParagraphStyle("t"), fontSize=6.8, leading=9))

    def _conf_bar(self, confidence):
        pct = int(confidence * 100)
        filled = max(1, int(pct / 5))
        empty = 20 - filled
        bar = (
            f'<font name="Helvetica-Bold" size="6.8" color="{C_NAVY.hexval()}">{pct:.1f}%</font>  '
            f'<font color="{C_GREEN.hexval()}" size="6.5">{"\u2588" * filled}</font>'
            f'<font color="{C_GRAY.hexval()}" size="6.5">{"\u2591" * empty}</font>')
        return Paragraph(bar, ParagraphStyle("CB", parent=ParagraphStyle("t"), fontSize=6.8, leading=9))

    def _explorer_link(self, url):
        if url:
            html = (
                f'<link href="{url}" color="{C_GREEN.hexval()}">'
                f'<font name="Helvetica" size="6.8" color="{C_GREEN.hexval()}">'
                f'View on Sepolia Etherscan</font></link>')
            return Paragraph(html, ParagraphStyle("EL", parent=ParagraphStyle("t"), fontSize=6.8, leading=9))
        return Paragraph("\u2014", ParagraphStyle("t", fontSize=6.8))

    def _cert_info_table(self, d, s_lbl, s_lblB, s_val, s_mono, s_badge, col_w):
        rows = [
            [self._icon_cell(I_DOC),   Paragraph("Certificate ID", s_lbl),   Paragraph(str(d["claim_code"]), s_val)],
            [self._icon_cell(I_DOC),   Paragraph("Claim ID", s_lbl),         Paragraph(str(d["claim_id"]), s_mono)],
            [self._icon_cell(I_TREE),  Paragraph("Claim Type", s_lbl),       Paragraph(d["claim_type"], s_val)],
            [self._icon_cell(I_SHIELD),Paragraph("Verification Status", s_lbl), self._status_badge(d["status"])],
            [self._icon_cell(I_CHART), Paragraph("Confidence Score", s_lbl), self._conf_bar(d["confidence"])],
            [self._icon_cell(I_HASH),  Paragraph("Estimated Quantity", s_lbl), Paragraph(d["qty_txt"], s_val)],
            [self._icon_cell(I_CAL),   Paragraph("Issue Date", s_lbl),       Paragraph(d["issued_at"].strftime("%B %d, %Y"), s_val)],
            [self._icon_cell(I_CLOCK), Paragraph("Verification Time", s_lbl), Paragraph(d["issued_at"].strftime("%H:%M:%S UTC"), s_val)],
        ]
        tbl = Table(rows, colWidths=[0.4*cm, col_w*0.40, col_w*0.55])
        tbl.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), C_WHITE),
            ("LINEBELOW", (0,0), (-1,-2), 0.4, C_GRAY),
            ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
            ("LEFTPADDING", (0,0), (-1,-1), 3),
            ("RIGHTPADDING", (0,0), (-1,-1), 4),
            ("TOPPADDING", (0,0), (-1,-1), 3),
            ("BOTTOMPADDING", (0,0), (-1,-1), 3),
            ("BOX", (0,0), (-1,-1), 0.5, C_GRAY),
        ]))
        return self._section_box("CERTIFICATE INFORMATION", tbl, col_w)

    def _ai_summary_table(self, d, s_body, s_lblB, s_val, col_w):
        content = []

        # Reasoning
        content.append(Paragraph(
            f'<font color="{C_GREEN.hexval()}">{I_BRAIN}</font>  '
            f'<font name="Helvetica-Bold" size="7" color="{C_NAVY.hexval()}">REASONING</font><br/>'
            f'<font size="6.8" color="{C_TEXT.hexval()}">{d["reason"]}</font>', s_body))
        content.append(Spacer(1, 0.1 * cm))

        # Detected Objects
        content.append(Paragraph(
            f'<font color="{C_GREEN.hexval()}">{I_LEAF}</font>  '
            f'<font name="Helvetica-Bold" size="7" color="{C_NAVY.hexval()}">DETECTED OBJECTS</font>', s_body))
        if d["obj_list"]:
            tags = "  ".join([f"{l} {c}%" if c > 0 else l for l, c in d["obj_list"][:8]])
            content.append(Paragraph(tags, ParagraphStyle(
                "OT", parent=s_body, fontSize=6.5, textColor=C_GREEN, fontName="Helvetica")))
        else:
            content.append(Paragraph("None detected", s_body))
        content.append(Spacer(1, 0.1 * cm))

        # Limitations
        content.append(Paragraph(
            f'<font color="{C_GREEN.hexval()}">{I_WARN}</font>  '
            f'<font name="Helvetica-Bold" size="7" color="{C_NAVY.hexval()}">LIMITATIONS</font><br/>'
            f'<font size="6.8" color="{C_TEXT.hexval()}">{d["limitations"]}</font>', s_body))
        content.append(Spacer(1, 0.1 * cm))

        # Recommendation
        content.append(Paragraph(
            f'<font color="{C_GREEN.hexval()}">{I_STAR}</font>  '
            f'<font name="Helvetica-Bold" size="7" color="{C_NAVY.hexval()}">RECOMMENDATION</font><br/>'
            f'<font size="6.8" color="{C_TEXT.hexval()}">{d["recommendation"]}</font>', s_body))

        tbl = Table([[content]], colWidths=[col_w])
        tbl.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), C_WHITE),
            ("BOX", (0,0), (-1,-1), 0.5, C_GRAY),
            ("LEFTPADDING", (0,0), (-1,-1), 6),
            ("RIGHTPADDING", (0,0), (-1,-1), 6),
            ("TOPPADDING", (0,0), (-1,-1), 5),
            ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ]))
        return self._section_box("AI VERIFICATION SUMMARY", tbl, col_w)

    def _blockchain_section(self, d, s_lbl, s_lblB, s_val, s_mono, s_badge, cw):
        rows = [
            [self._icon_cell(I_HASH),  Paragraph("Verification Hash", s_lbl),  Paragraph(d["v_hash"], s_mono)],
            [self._icon_cell(I_LINK),  Paragraph("Transaction Hash", s_lbl),   Paragraph(d["tx_hash"], s_mono)],
            [self._icon_cell(I_LINK),  Paragraph("Contract Address", s_lbl),   Paragraph(d["contract"], s_mono)],
            [self._icon_cell(I_HASH),  Paragraph("Block Number", s_lbl),       Paragraph(d["block_txt"], s_val)],
            [self._icon_cell(I_ETH),   Paragraph("Network", s_lbl),            Paragraph(f"  {d['network']}", s_val)],
            [self._icon_cell(I_CLOCK), Paragraph("Timestamp", s_lbl),          Paragraph(d["issued_at"].strftime("%Y-%m-%d %H:%M:%S UTC"), s_val)],
            [self._icon_cell(I_LINK),  Paragraph("Explorer URL", s_lbl),       self._explorer_link(d["explorer"])],
            [self._icon_cell(I_SHIELD),Paragraph("Blockchain Status", s_lbl),  self._status_badge(d["bc_status"])],
        ]
        tbl = Table(rows, colWidths=[0.4*cm, cw*0.27, cw*0.66])
        tbl.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), C_WHITE),
            ("LINEBELOW", (0,0), (-1,-2), 0.4, C_GRAY),
            ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
            ("LEFTPADDING", (0,0), (-1,-1), 3),
            ("RIGHTPADDING", (0,0), (-1,-1), 4),
            ("TOPPADDING", (0,0), (-1,-1), 3),
            ("BOTTOMPADDING", (0,0), (-1,-1), 3),
            ("BOX", (0,0), (-1,-1), 0.5, C_GRAY),
        ]))
        return self._section_box("BLOCKCHAIN VERIFICATION", tbl, cw)

    def _signature_section(self, d, s_lbl, s_lblB, s_val, s_badge, cw):
        sig_w = cw / 3

        # LEFT: signature info
        sig_rows = [
            [self._icon_cell(I_PERSON),  Paragraph("Verified By", s_lblB),     Paragraph("VisionLedger AI Verification Engine", s_val)],
            [self._icon_cell(I_ANCHOR),  Paragraph("Blockchain Anchor", s_lblB), Paragraph("Ethereum Sepolia", s_val)],
            [self._icon_cell(I_PEN),     Paragraph("Digitally Signed", s_lblB),  Paragraph("Yes", s_val)],
        ]
        sig_tbl = Table(sig_rows, colWidths=[0.35*cm, sig_w*0.35, sig_w*0.55])
        sig_tbl.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), C_WHITE),
            ("LINEBELOW", (0,0), (-1,-2), 0.4, C_GRAY),
            ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
            ("LEFTPADDING", (0,0), (-1,-1), 2),
            ("RIGHTPADDING", (0,0), (-1,-1), 3),
            ("TOPPADDING", (0,0), (-1,-1), 3),
            ("BOTTOMPADDING", (0,0), (-1,-1), 3),
            ("BOX", (0,0), (-1,-1), 0.5, C_GRAY),
        ]))

        # CENTER: seal placeholder (drawn by canvas callback)
        seal_ph = Table([[""]], colWidths=[sig_w], rowHeights=[2.2*cm])
        seal_ph.setStyle(TableStyle([
            ("BOX", (0,0), (-1,-1), 0.5, C_GRAY),
            ("BACKGROUND", (0,0), (-1,-1), C_WHITE),
        ]))

        # RIGHT: QR code
        qr_payload = (
            f"VisionLedger|{d['claim_code']}|{d['status']}|{d['confidence']:.2f}|"
            f"{d['v_hash']}|{d['tx_hash']}")
        qr_img = qrcode.make(qr_payload, box_size=7, border=2)
        qr_buf = io.BytesIO()
        qr_img.save(qr_buf, format="PNG")
        qr_buf.seek(0)

        qr_content = [
            Image(qr_buf, width=1.8*cm, height=1.8*cm),
            Paragraph("Scan to Verify Authenticity", ParagraphStyle(
                "QL", parent=ParagraphStyle("t"), fontSize=6,
                alignment=TA_CENTER, fontName="Helvetica-Bold", textColor=C_NAVY)),
            Paragraph("or visit", ParagraphStyle(
                "QO", parent=ParagraphStyle("t"), fontSize=5.5, alignment=TA_CENTER)),
            Paragraph("visionledger.app/verify", ParagraphStyle(
                "QU", parent=ParagraphStyle("t"), fontSize=5.5,
                alignment=TA_CENTER, fontName="Helvetica-Bold", textColor=C_GREEN)),
        ]
        qr_tbl = Table([[qr_content]], colWidths=[sig_w])
        qr_tbl.setStyle(TableStyle([
            ("BOX", (0,0), (-1,-1), 0.5, C_GRAY),
            ("BACKGROUND", (0,0), (-1,-1), C_WHITE),
            ("ALIGN", (0,0), (-1,-1), "CENTER"),
            ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
            ("LEFTPADDING", (0,0), (-1,-1), 4),
            ("RIGHTPADDING", (0,0), (-1,-1), 4),
            ("TOPPADDING", (0,0), (-1,-1), 4),
            ("BOTTOMPADDING", (0,0), (-1,-1), 4),
        ]))

        sig_combined = Table([[sig_tbl, seal_ph, qr_tbl]], colWidths=[sig_w, sig_w, sig_w])
        sig_combined.setStyle(TableStyle([
            ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ]))
        return self._section_box("DIGITAL SIGNATURE", sig_combined, cw)

    # ── Canvas Decorations ─────────────────────────────────────

    def _draw_frame(self, c, doc, pw, ph):
        c.saveState()

        # Outer gold border
        c.setStrokeColor(C_GOLD)
        c.setLineWidth(1.2)
        c.rect(0.25*cm, 0.25*cm, pw-0.5*cm, ph-0.5*cm)

        # Inner green border
        c.setStrokeColor(C_GREEN)
        c.setLineWidth(0.6)
        c.rect(0.4*cm, 0.4*cm, pw-0.8*cm, ph-0.8*cm)

        # Corner ornaments
        c.setFillColor(C_GOLD)
        cs = 0.12*cm
        for x, y in [
            (0.25*cm, 0.25*cm),
            (pw-0.25*cm-cs, 0.25*cm),
            (0.25*cm, ph-0.25*cm-cs),
            (pw-0.25*cm-cs, ph-0.25*cm-cs),
        ]:
            c.rect(x, y, cs, cs, fill=1, stroke=0)

        # ── Circular Seal ──
        sx = pw / 2
        sy = 2.8*cm
        sr = 0.95*cm

        # Outer gold circle
        c.setStrokeColor(C_GOLD); c.setLineWidth(1.2)
        c.circle(sx, sy, sr)
        # Inner gold circle
        c.setLineWidth(0.6)
        c.circle(sx, sy, sr-0.12*cm)
        # Dashed middle
        c.setStrokeColor(C_GOLD_LT); c.setDash(2.5, 2.5)
        c.circle(sx, sy, sr-0.24*cm)
        c.setDash()

        # Arc text: VISIONLEDGER (top)
        c.setFillColor(C_GREEN)
        c.setFont("Helvetica-Bold", 5.5)
        arc_r = sr - 0.38*cm
        text_top = "VISIONLEDGER"
        for i, ch in enumerate(text_top):
            angle = 180 - (i+0.5) * (110/len(text_top))
            rad = math.radians(angle)
            tx = sx + arc_r * math.cos(rad)
            ty = sy + arc_r * math.sin(rad)
            c.saveState()
            c.translate(tx, ty)
            c.rotate(angle - 90)
            c.drawCentredString(0, 0, ch)
            c.restoreState()

        # Arc text: VERIFIED & ANCHORED (bottom)
        c.setFont("Helvetica-Bold", 5)
        text_bot = "VERIFIED & ANCHORED"
        for i, ch in enumerate(text_bot):
            angle = (i+0.5) * (130/len(text_bot))
            rad = math.radians(angle)
            tx = sx + arc_r * math.cos(rad)
            ty = sy + arc_r * math.sin(rad)
            c.saveState()
            c.translate(tx, ty)
            c.rotate(angle + 90)
            c.drawCentredString(0, 0, ch)
            c.restoreState()

        # Center shield
        c.setFillColor(C_GREEN)
        c.setFont("Helvetica", 16)
        c.drawCentredString(sx, sy-0.15*cm, I_SHIELD)

        # Dots around seal
        c.setFillColor(C_GOLD)
        for i in range(12):
            a = math.radians(i * 30)
            dx = sx + (sr-0.06*cm) * math.cos(a)
            dy = sy + (sr-0.06*cm) * math.sin(a)
            c.circle(dx, dy, 0.03*cm, fill=1, stroke=0)

        c.restoreState()
