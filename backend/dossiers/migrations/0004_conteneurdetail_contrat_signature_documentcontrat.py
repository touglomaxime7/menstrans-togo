from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('dossiers', '0003_dossier_classification_dossier_mode_sortie_contrat_piececontrat'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Ajout des terminaux dans mode_sortie
        migrations.AlterField(
            model_name='dossier',
            name='mode_sortie',
            field=models.CharField(
                blank=True, null=True, max_length=30,
                choices=[
                    ('camion',        'Camion'),
                    ('depotage',      'Dépotage'),
                    ('terminal_pia',  'Terminal PIA'),
                    ('terminal_togo', 'Terminal Togo'),
                    ('terminal_bmh',  'Terminal BMH'),
                    ('autre',         'Autre terminal'),
                ]),
        ),

        # Signatures électroniques sur le contrat
        migrations.AddField(
            model_name='contrat',
            name='signature_dg',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='contrat',
            name='signature_client',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='contrat',
            name='signe_par_dg_le',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='contrat',
            name='signe_par_client_le',
            field=models.DateTimeField(blank=True, null=True),
        ),

        # Nouveau modèle ConteneurDetail
        migrations.CreateModel(
            name='ConteneurDetail',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True,
                                           serialize=False, verbose_name='ID')),
                ('type_conteneur', models.CharField(
                    blank=True, max_length=30,
                    choices=[
                        ('20_standard', "20' Standard"),
                        ('40_standard', "40' Standard"),
                        ('40_hc',       "40' High Cube"),
                        ('20_frigo',    "20' Frigorifique"),
                        ('40_frigo',    "40' Frigorifique"),
                        ('open_top',    'Open Top'),
                        ('flat_rack',   'Flat Rack'),
                    ])),
                ('nombre_conteneurs',  models.PositiveIntegerField(default=1)),
                ('type_marchandise',   models.CharField(blank=True, max_length=200)),
                ('poids_total_kg',     models.DecimalField(blank=True, decimal_places=2,
                                                           max_digits=10, null=True)),
                ('volume_m3',          models.DecimalField(blank=True, decimal_places=2,
                                                           max_digits=10, null=True)),
                ('numero_bl',          models.CharField(blank=True, max_length=50)),
                ('port_chargement',    models.CharField(blank=True, max_length=100)),
                ('port_dechargement',  models.CharField(blank=True, max_length=100)),
                ('compagnie_maritime', models.CharField(blank=True, max_length=100)),
                ('observations',       models.TextField(blank=True)),
                ('cree_le',            models.DateTimeField(auto_now_add=True)),
                ('modifie_le',         models.DateTimeField(auto_now=True)),
                ('dossier', models.OneToOneField(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='conteneur', to='dossiers.dossier')),
            ],
            options={'db_table': 'conteneurs', 'verbose_name': 'Détail conteneur'},
        ),

        # Nouveau modèle DocumentContrat
        migrations.CreateModel(
            name='DocumentContrat',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True,
                                           serialize=False, verbose_name='ID')),
                ('nom',       models.CharField(max_length=200)),
                ('type_doc',  models.CharField(
                    default='autre', max_length=30,
                    choices=[
                        ('contrat_signe', 'Contrat signé'),
                        ('annexe',        'Annexe'),
                        ('procuration',   'Procuration'),
                        ('autre',         'Autre document'),
                    ])),
                ('fichier',    models.FileField(upload_to='contrats/documents/')),
                ('taille_kb',  models.PositiveIntegerField(default=0)),
                ('uploade_le', models.DateTimeField(auto_now_add=True)),
                ('contrat', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='documents', to='dossiers.contrat')),
                ('uploade_par', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    to=settings.AUTH_USER_MODEL)),
            ],
            options={'db_table': 'documents_contrat', 'ordering': ['-uploade_le'],
                     'verbose_name': 'Document de contrat'},
        ),
    ]