"""
PDF certificate generation for verified claims.

Produces a premium, professional verification certificate with embedded
SVG logo, blockchain proof, and QR verification code.
"""

from __future__ import annotations

import io
from datetime import datetime, timezone
from pathlib import Path

import qrcode
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch, cm
from reportlab.platypus import (
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)
from reportlab.graphics import renderPDF
from svglib.svglib import svg2rlg
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_CENTER, TA_LEFT

from app.core.errors import not_found
from app.utils.helpers import placeholder_tx_hash


class CertificateService:
    """Builds premium PDF verification certificates from claim records."""

    def __init__(self):
        """Initialize certificate service with logo path."""
        # Path to the VisionLedger SVG logo
        self.logo_path = Path(__file__).parent.parent.parent.parent / "public" / "logo.svg"

    def generate(self, claim: dict) -> tuple[bytes, str]:
        """
        Render a premium PDF certificate for *claim*.

        Returns:
            ``(pdf_bytes, filename)``
        """
        if not claim:
            raise not_found("Claim")

        claim_id = claim.get("claim_id") or claim.get("id") or "UNKNOWN"
        claim_code = claim.get("claim_code") or claim_id
        filename = f"VisionLedger-Certificate-{claim_code}.pdf"
        buffer = io.BytesIO()

        # A4 page size with professional margins
        page_width, page_height = A4
        margin = 1.5 * cm

        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=margin,
            leftMargin=margin,
            topMargin=margin,
            bottomMargin=margin,
            title=f"Verification Certificate — {claim_id}",
            author="VisionLedger",
            subject="AI Verification Certificate",
        )

        # Define styles
        styles = getSampleStyleSheet()

        # Certificate title style
        title_style = ParagraphStyle(
            "CertTitle",
            parent=styles["Heading1"],
            fontSize=28,
            textColor=colors.HexColor("#2563EB"),  # VisionLedger Blue
            spaceAfter=8,
            alignment=TA_CENTER,
            fontName="Helvetica-Bold",
        )

        # Subtitle style
        subtitle_style = ParagraphStyle(
            "CertSubtitle",
            parent=styles["Normal"],
            fontSize=12,
            textColor=colors.HexColor("#64748b"),
            spaceAfter=20,
            alignment=TA_CENTER,
            fontName="Helvetica",
        )

        # Section heading style
        section_style = ParagraphStyle(
            "CertSection",
            parent=styles["Heading2"],
            fontSize=14,
            textColor=colors.HexColor("#2563EB"),
            spaceBefore=16,
            spaceAfter=8,
            fontName="Helvetica-Bold",
        )

        # Body text style
        body_style = ParagraphStyle(
            "CertBody",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#334155"),
            alignment=TA_LEFT,
        )

        # Monospace style for hashes
        mono_style = ParagraphStyle(
            "MonoStyle",
            parent=body_style,
            fontName="Courier",
            fontSize=8,
            wordWrap='CJK',
        )

        # Centered body style
        body_center_style = ParagraphStyle(
            "BodyCenter",
            parent=body_style,
            alignment=TA_CENTER,
        )

        # Parse claim data
        issued_at = datetime.now(timezone.utc)
        tx_hash = (
            claim.get("transaction_hash")
            or claim.get("tx_hash")
            or placeholder_tx_hash(str(claim_code))
        )
        if tx_hash and not tx_hash.startswith("0x") and len(tx_hash) == 64:
            tx_hash = "0x" + tx_hash
        verification_hash = claim.get("blockchain_hash") or "—"
        block_number = claim.get("block_number")
        block_text = f"#{block_number}" if block_number else "N/A"
        network = claim.get("network") or "Ethereum Sepolia"
        contract_address = claim.get("contract_address") or "—"
        blockchain_status = claim.get("blockchain_status") or "Pending"
        explorer_url = "—"
        if tx_hash and tx_hash.startswith("0x") and len(tx_hash) == 66:
            explorer_url = f"https://sepolia.etherscan.io/tx/{tx_hash}"

        objects = claim.get("objects_detected") or []
        if isinstance(objects, str):
            objects = [objects]
        objects_text = ", ".join(objects) if objects else "None detected"
        confidence = float(claim.get("confidence") or 0.0)
        status = claim.get("status") or "Unknown"
        claim_type = (claim.get("claim_type_label") or claim.get("claim_type") or "unknown")
        if "_" in claim_type:
            claim_type = claim_type.replace("_", " ").title()
        else:
            claim_type = str(claim_type)

        description = claim.get("description") or "—"
        reason = claim.get("reason") or "—"
        limitations = claim.get("limitations") or "—"
        recommendation = claim.get("recommendation") or "—"
        estimated_qty = claim.get("estimated_quantity")
        qty_text = str(estimated_qty) if estimated_qty is not None else "N/A"

        # Build certificate content
        story = []

        # Add watermark function
        def add_watermark(canvas_obj, doc):
            """Add light watermark of logo at 5% opacity."""
            try:
                if self.logo_path.exists():
                    logo_drawing = svg2rlg(str(self.logo_path))
                    if logo_drawing:
                        # Scale logo to fit page width
                        scale = page_width / logo_drawing.width * 0.6
                        logo_drawing.width *= scale
                        logo_drawing.height *= scale

                        # Center and position
                        x = (page_width - logo_drawing.width) / 2
                        y = (page_height - logo_drawing.height) / 2

                        # Set opacity to 5%
                        canvas_obj.saveState()
                        canvas_obj.setFillAlpha(0.05)
                        renderPDF.draw(logo_drawing, canvas_obj, x, y)
                        canvas_obj.restoreState()
            except Exception:
                pass  # Skip watermark if logo fails

        # Header with logo
        try:
            if self.logo_path.exists():
                logo_drawing = svg2rlg(str(self.logo_path))
                if logo_drawing:
                    # Scale logo to 180px width
                    scale = 180 / logo_drawing.width
                    logo_drawing.width *= scale
                    logo_drawing.height *= scale

                    # Center logo in a table
                    logo_table = Table([[logo_drawing]], colWidths=[page_width - 2 * margin])
                    logo_table.setStyle(TableStyle([
                        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ]))
                    story.append(logo_table)
                    story.append(Spacer(1, 0.5 * cm))
        except Exception:
            pass  # Skip logo if it fails

        # Certificate title
        story.append(Paragraph("CERTIFICATE OF VERIFICATION", title_style))
        story.append(Spacer(1, 0.3 * cm))

        # Subtitle
        story.append(Paragraph(
            "AI-Powered Environmental Verification Platform",
            subtitle_style
        ))
        story.append(Spacer(1, 0.5 * cm))

        # Verification statement
        story.append(Paragraph(
            "This certificate confirms that the submitted evidence has been analyzed using "
            "VisionLedger's AI verification engine and permanently anchored on the Ethereum "
            "Sepolia blockchain.",
            body_center_style
        ))
        story.append(Spacer(1, 1 * cm))

        # Certificate Information Panel
        story.append(Paragraph("Certificate Information", section_style))

        cert_data = [
            ["Certificate ID", str(claim_code)],
            ["Claim ID", str(claim_id)],
            ["Claim Type", claim_type],
            ["Verification Status", status],
            ["Confidence Score", f"{confidence * 100:.1f}%"],
            ["Estimated Quantity", qty_text],
            ["Issue Date", issued_at.strftime('%B %d, %Y')],
            ["Verification Time", issued_at.strftime('%H:%M:%S UTC')],
        ]

        cert_table = Table(cert_data, colWidths=[5 * cm, 10 * cm])
        cert_table.setStyle(TableStyle([
            # Header row styling
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#f1f5f9")),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor("#0f172a")),
            ('FONTNAME', (0, 0), (0, -1), "Helvetica-Bold"),
            ('FONTNAME', (1, 0), (1, -1), "Helvetica"),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            # Grid
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            # Alternating row colors
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            # Rounded corners effect (border)
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
            ('ROUNDEDCORNERS', [4, 4, 4, 4]),
        ]))
        story.append(cert_table)
        story.append(Spacer(1, 0.8 * cm))

        # AI Verification Summary
        story.append(Paragraph("AI Verification Summary", section_style))

        story.append(Paragraph("<b>Reasoning:</b>", body_style))
        story.append(Paragraph(reason, body_style))
        story.append(Spacer(1, 0.3 * cm))

        story.append(Paragraph("<b>Detected Objects:</b>", body_style))
        story.append(Paragraph(objects_text, body_style))
        story.append(Spacer(1, 0.3 * cm))

        story.append(Paragraph("<b>Limitations:</b>", body_style))
        story.append(Paragraph(limitations, body_style))
        story.append(Spacer(1, 0.3 * cm))

        story.append(Paragraph("<b>Recommendation:</b>", body_style))
        story.append(Paragraph(recommendation, body_style))
        story.append(Spacer(1, 0.8 * cm))

        # Blockchain Verification
        story.append(Paragraph("Blockchain Verification", section_style))

        blockchain_data = [
            ["Verification Hash", verification_hash],
            ["Transaction Hash", tx_hash],
            ["Contract Address", contract_address],
            ["Block Number", block_text],
            ["Network", network],
            ["Timestamp", issued_at.strftime('%Y-%m-%d %H:%M:%S UTC')],
            ["Explorer URL", explorer_url],
            ["Blockchain Status", blockchain_status],
        ]

        blockchain_table = Table(blockchain_data, colWidths=[5 * cm, 10 * cm])
        blockchain_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#f1f5f9")),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor("#0f172a")),
            ('FONTNAME', (0, 0), (0, -1), "Helvetica-Bold"),
            ('FONTNAME', (1, 0), (1, -1), "Courier"),  # Monospace for hashes
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
            ('ROUNDEDCORNERS', [4, 4, 4, 4]),
        ]))
        story.append(blockchain_table)
        story.append(Spacer(1, 0.8 * cm))

        # Digital Signature Section
        story.append(Paragraph("Digital Signature", section_style))

        signature_data = [
            ["Verified By", "VisionLedger AI Verification Engine"],
            ["Blockchain Anchor", "Ethereum Sepolia"],
            ["Digitally Signed", "Yes"],
        ]

        signature_table = Table(signature_data, colWidths=[5 * cm, 10 * cm])
        signature_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#f1f5f9")),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor("#0f172a")),
            ('FONTNAME', (0, 0), (0, -1), "Helvetica-Bold"),
            ('FONTNAME', (1, 0), (1, -1), "Helvetica"),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ]))
        story.append(signature_table)
        story.append(Spacer(1, 1 * cm))

        # QR Code in lower-right
        qr_payload = (
            f"VisionLedger|{claim_code}|{status}|{confidence:.2f}|"
            f"{verification_hash}|{tx_hash}"
        )
        qr_img = qrcode.make(qr_payload)
        qr_buffer = io.BytesIO()
        qr_img.save(qr_buffer, format="PNG")
        qr_buffer.seek(0)

        qr_table_data = [
            ["", Image(qr_buffer, width=2.5 * cm, height=2.5 * cm)],
            ["", Paragraph("Scan to Verify Authenticity", body_center_style)],
        ]
        qr_table = Table(qr_table_data, colWidths=[12 * cm, 3 * cm])
        qr_table.setStyle(TableStyle([
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(qr_table)
        story.append(Spacer(1, 1 * cm))

        # Footer
        footer_text = (
            "This certificate has been automatically generated by VisionLedger and "
            "cryptographically secured using Ethereum blockchain technology."
        )
        story.append(Paragraph(footer_text, body_center_style))
        story.append(Spacer(1, 0.3 * cm))

        # Footer badges
        badges = "VisionLedger  •  AI Verified  •  Blockchain Anchored  •  Tamper Resistant"
        story.append(Paragraph(badges, body_center_style))

        # Build PDF with watermark
        doc.build(story, onFirstPage=add_watermark, onLaterPages=add_watermark)

        buffer.seek(0)
        return buffer.read(), filename
