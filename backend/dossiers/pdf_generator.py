from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from io import BytesIO
from datetime import datetime


def generer_pdf_dossier(dossier, documents=None, montants=None, factures=None):
    """Génère un PDF complet du dossier"""
    buffer = BytesIO()
    
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
    )
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Styles personnalisés
    style_title = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=colors.HexColor('#1F3864'),
        alignment=TA_CENTER,
        spaceAfter=20,
        fontName='Helvetica-Bold'
    )
    
    style_subtitle = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#1F3864'),
        spaceAfter=10,
        fontName='Helvetica-Bold'
    )
    
    style_normal = styles['Normal']
    style_normal.fontSize = 10
    
    # En-tête entreprise
    elements.append(Paragraph("<b>MENSTRANS-TOGO</b>", style_title))
    elements.append(Paragraph("Gestion de Transit & Facturation", ParagraphStyle('center', alignment=TA_CENTER, fontSize=10, textColor=colors.grey)))
    elements.append(Spacer(1, 0.5*cm))
    
    # Ligne séparatrice
    line_table = Table([['']],colWidths=[17*cm], rowHeights=[2])
    line_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#1F3864')),
    ]))
    elements.append(line_table)
    elements.append(Spacer(1, 0.5*cm))
    
    # Numéro de dossier
    elements.append(Paragraph(f"<b>DOSSIER N° {dossier.numero_dossier}</b>", style_title))
    elements.append(Spacer(1, 0.3*cm))
    
    # Statut
    statut_color = {
        'nouveau': '#9333ea',
        'transit': '#2563eb',
        'passation': '#d97706',
        'logistique': '#16a34a',
        'livraison': '#10b981',
        'cloture': '#6b7280',
    }
    color = statut_color.get(dossier.statut, '#6b7280')
    elements.append(Paragraph(
        f'<para alignment="center"><font color="{color}" size="14"><b>STATUT : {dossier.statut.upper()}</b></font></para>',
        style_normal
    ))
    elements.append(Spacer(1, 0.5*cm))
    
    # Informations dossier
    elements.append(Paragraph("INFORMATIONS DU DOSSIER", style_subtitle))
    
    info_data = [
        ['Numéro de dossier:', dossier.numero_dossier],
        ['Client:', dossier.client.nom if dossier.client else '—'],
        ['Type de transport:', dossier.type_transport.capitalize()],
        ['Date d\'ouverture:', dossier.date_debut.strftime('%d/%m/%Y') if dossier.date_debut else '—'],
        ['Date de clôture:', dossier.date_fin.strftime('%d/%m/%Y') if dossier.date_fin else '—'],
        ['Créé par:', f"{dossier.cree_par.prenom} {dossier.cree_par.nom}" if dossier.cree_par else '—'],
        ['Statut:', dossier.statut.upper()],
    ]
    
    info_table = Table(info_data, colWidths=[5*cm, 12*cm])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#f3f4f6')),
        ('TEXTCOLOR', (0,0), (0,-1), colors.HexColor('#1F3864')),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (1,0), (1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#d1d5db')),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 0.5*cm))
    
    # Informations client
    if dossier.client:
        elements.append(Paragraph("INFORMATIONS CLIENT", style_subtitle))
        client_data = [
            ['Nom:', dossier.client.nom],
            ['Email:', getattr(dossier.client, 'email', '') or '—'],
            ['Téléphone:', getattr(dossier.client, 'telephone', '') or '—'],
            ['Adresse:', getattr(dossier.client, 'adresse', '') or '—'],
        ]
        client_table = Table(client_data, colWidths=[5*cm, 12*cm])
        client_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0,0), (0,-1), colors.HexColor('#1F3864')),
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('FONTNAME', (1,0), (1,-1), 'Helvetica'),
            ('FONTSIZE', (0,0), (-1,-1), 10),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#d1d5db')),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(client_table)
        elements.append(Spacer(1, 0.5*cm))
    
    # Observations
    if dossier.observations:
        elements.append(Paragraph("OBSERVATIONS", style_subtitle))
        obs_text = dossier.observations.replace('\n', '<br/>')
        elements.append(Paragraph(obs_text, style_normal))
        elements.append(Spacer(1, 0.5*cm))
    
    # Documents
    if documents and len(documents) > 0:
        elements.append(Paragraph(f"DOCUMENTS ASSOCIÉS ({len(documents)})", style_subtitle))
        doc_data = [['Code', 'Type', 'Fichier', 'Statut', 'Date']]
        for d in documents:
            doc_data.append([
                d.code_document or '—',
                d.type_document or '—',
                d.nom_fichier[:30] + '...' if len(d.nom_fichier) > 30 else d.nom_fichier,
                d.statut or '—',
                d.date_scan.strftime('%d/%m/%Y') if d.date_scan else '—',
            ])
        doc_table = Table(doc_data, colWidths=[3*cm, 3*cm, 5*cm, 3*cm, 3*cm])
        doc_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1F3864')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#d1d5db')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f9fafb')]),
        ]))
        elements.append(doc_table)
        elements.append(Spacer(1, 0.5*cm))
    
    # Montants financiers
    if montants and len(montants) > 0:
        elements.append(Paragraph(f"MONTANTS FINANCIERS ({len(montants)})", style_subtitle))
        montant_data = [['Libellé', 'Type', 'Débours (F)', 'Facturé (F)', 'Statut']]
        total_debours = 0
        total_facture = 0
        for m in montants:
            debours = float(m.debours or 0)
            facture = float(m.facture or 0)
            total_debours += debours
            total_facture += facture
            montant_data.append([
                m.libelle[:25] if m.libelle else '—',
                m.type_montant or '—',
                f"{debours:,.0f}",
                f"{facture:,.0f}",
                m.statut or '—',
            ])
        montant_data.append([
            'TOTAL',
            '',
            f"{total_debours:,.0f} F",
            f"{total_facture:,.0f} F",
            '',
        ])
        montant_table = Table(montant_data, colWidths=[5*cm, 3*cm, 3*cm, 3*cm, 3*cm])
        montant_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1F3864')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#fef3c7')),
            ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#d1d5db')),
            ('ALIGN', (2,0), (3,-1), 'RIGHT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        elements.append(montant_table)
        elements.append(Spacer(1, 0.5*cm))
    
    # Factures
    if factures and len(factures) > 0:
        elements.append(Paragraph(f"FACTURES ({len(factures)})", style_subtitle))
        fac_data = [['N° Facture', 'Date', 'Montant TTC (F)', 'Statut']]
        total = 0
        for f in factures:
            montant = float(f.montant_ttc or 0)
            total += montant
            fac_data.append([
                f.numero_facture or '—',
                f.date_facture.strftime('%d/%m/%Y') if f.date_facture else '—',
                f"{montant:,.0f}",
                f.statut or '—',
            ])
        fac_data.append(['TOTAL', '', f"{total:,.0f} F", ''])
        fac_table = Table(fac_data, colWidths=[4*cm, 4*cm, 5*cm, 4*cm])
        fac_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1F3864')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#fef3c7')),
            ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#d1d5db')),
            ('ALIGN', (2,0), (2,-1), 'RIGHT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        elements.append(fac_table)
    
    # Pied de page
    elements.append(Spacer(1, 1*cm))
    elements.append(Paragraph(
        f'<para alignment="center"><font size="8" color="grey">'
        f'Document généré le {datetime.now().strftime("%d/%m/%Y à %H:%M")} - MENSTRANS-TOGO'
        f'</font></para>',
        style_normal
    ))
    
    doc.build(elements)
    
    pdf = buffer.getvalue()
    buffer.close()
    return pdf