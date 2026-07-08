"""
PDF certificate generation for verified claims.

Produces a downloadable verification certificate containing claim
details, AI assessment summary, and a placeholder blockchain hash.
"""

from __future__ import annotations

import io
from datetime import datetime, timezone

import qrcode
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.core.errors import not_found
from app.utils.helpers import placeholder_tx_hash


class CertificateService:
    """Builds PDF verification certificates from claim records."""

    def generate(self, claim: dict) -> tuple[bytes, str]:
        """
        Render a PDF certificate for *claim*.

        Returns:
            ``(pdf_bytes, filename)``
        """
        if not claim:
            raise not_found("Claim")

        claim_id = claim.get("claim_id") or claim.get("id") or "UNKNOWN"
        claim_code = claim.get("claim_code") or claim_id
        filename = f"VisionLedger-Certificate-{claim_code}.pdf"
        buffer = io.BytesIO()

        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=0.75 * inch,
            leftMargin=0.75 * inch,
            topMargin=0.75 * inch,
            bottomMargin=0.75 * inch,
            title=f"Verification Certificate — {claim_id}",
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "CertTitle",
            parent=styles["Heading1"],
            fontSize=22,
            textColor=colors.HexColor("#0f766e"),
            spaceAfter=6,
        )
        subtitle_style = ParagraphStyle(
            "CertSubtitle",
            parent=styles["Normal"],
            fontSize=11,
            textColor=colors.HexColor("#64748b"),
            spaceAfter=16,
        )
        section_style = ParagraphStyle(
            "CertSection",
            parent=styles["Heading2"],
            fontSize=13,
            textColor=colors.HexColor("#0f172a"),
            spaceBefore=12,
            spaceAfter=6,
        )
        body_style = ParagraphStyle(
            "CertBody",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#334155"),
        )

        issued_at = datetime.now(timezone.utc)
        tx_hash = claim.get("tx_hash") or placeholder_tx_hash(str(claim_code))
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

        story: list = [
            Paragraph("VisionLedger", title_style),
            Paragraph("Verification Certificate", subtitle_style),
            Paragraph(
                f"Issued: {issued_at.strftime('%B %d, %Y at %H:%M UTC')}",
                body_style,
            ),
            Spacer(1, 0.2 * inch),
        ]

        details = [
            ["Claim ID", str(claim_code)],
            ["Record ID", str(claim_id)],
            ["Claim Type", claim_type],
            ["Verification Status", status],
            ["Confidence Score", f"{confidence * 100:.1f}%"],
            ["Estimated Quantity", qty_text],
            ["Transaction Hash (placeholder)", tx_hash],
        ]
        table = Table(details, colWidths=[2.2 * inch, 4.3 * inch])
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f1f5f9")),
                    ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#0f172a")),
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        story.extend([table, Spacer(1, 0.15 * inch)])

        story.append(Paragraph("Claim Description", section_style))
        story.append(Paragraph(description, body_style))
        story.append(Paragraph("Verification Summary", section_style))
        story.append(Paragraph(reason, body_style))
        story.append(Paragraph("Detected Objects", section_style))
        story.append(Paragraph(objects_text, body_style))
        story.append(Paragraph("Limitations", section_style))
        story.append(Paragraph(limitations, body_style))
        story.append(Paragraph("Recommendation", section_style))
        story.append(Paragraph(recommendation, body_style))

        qr_payload = (
            f"VisionLedger|{claim_code}|{status}|{confidence:.2f}|{tx_hash}"
        )
        qr_img = qrcode.make(qr_payload)
        qr_buffer = io.BytesIO()
        qr_img.save(qr_buffer, format="PNG")
        qr_buffer.seek(0)
        story.extend(
            [
                Spacer(1, 0.2 * inch),
                Paragraph("Certificate QR Code", section_style),
                Image(qr_buffer, width=1.2 * inch, height=1.2 * inch),
            ]
        )

        doc.build(story)
        buffer.seek(0)
        return buffer.read(), filename
