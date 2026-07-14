from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('dossiers', '0006_historiquedossier'),
    ]

    operations = [
        # Mettre à jour les choix des pièces de contrat
        migrations.AlterField(
            model_name='piececontrat',
            name='code_piece',
            field=__import__('django.db.models', fromlist=['CharField']).CharField(
                max_length=50,
                choices=[
                    ('certificat_origine',  "Certificat d'origine"),
                    ('facture_commerciale', 'Facture commerciale'),
                    ('bordereau',           'Bordereau'),
                    ('connaissement',       'Connaissement / Bill of Lading'),
                    ('assurance_maritime',  "Ordre d'assurance maritime"),
                ],
            ),
        ),
    ]