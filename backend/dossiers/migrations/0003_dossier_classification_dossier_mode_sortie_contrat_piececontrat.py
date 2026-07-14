from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('dossiers', '0002_alter_dossier_options_alter_dossier_statut_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='dossier',
            name='classification',
            field=models.CharField(
                choices=[('standard', 'Standard'), ('urgent', 'Urgent'),
                         ('vip', 'VIP'), ('contentieux', 'Contentieux')],
                default='standard', max_length=20),
        ),
        migrations.AddField(
            model_name='dossier',
            name='mode_sortie',
            field=models.CharField(
                choices=[('camion', 'Camion'), ('depotage', 'Dépotage')],
                blank=True, null=True, max_length=20),
        ),
        migrations.CreateModel(
            name='Contrat',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('numero_contrat', models.CharField(blank=True, max_length=30, unique=True)),
                ('statut', models.CharField(
                    choices=[('brouillon', 'Brouillon'), ('en_attente', 'En attente de validation'),
                             ('valide', 'Validé'), ('resilie', 'Résilié')],
                    default='brouillon', max_length=20)),
                ('objet', models.TextField(blank=True)),
                ('conditions', models.TextField(blank=True)),
                ('date_signature', models.DateField(blank=True, null=True)),
                ('date_debut', models.DateField(auto_now_add=True)),
                ('date_fin', models.DateField(blank=True, null=True)),
                ('cree_le', models.DateTimeField(auto_now_add=True)),
                ('modifie_le', models.DateTimeField(auto_now=True)),
                ('dossier', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='contrat', to='dossiers.dossier')),
                ('redige_par', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='contrats_rediges', to=settings.AUTH_USER_MODEL)),
                ('valide_par', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='contrats_valides', to=settings.AUTH_USER_MODEL)),
            ],
            options={'db_table': 'contrats', 'ordering': ['-cree_le'], 'verbose_name': 'Contrat'},
        ),
        migrations.CreateModel(
            name='PieceContrat',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code_piece', models.CharField(
                    choices=[
                        ('piece_identite', "Pièce d'identité du client"),
                        ('registre_commerce', 'Registre de commerce'),
                        ('mandat_representation', 'Mandat de représentation'),
                        ('procuration', 'Procuration signée'),
                        ('engagement_paiement', "Lettre d'engagement de paiement"),
                    ], max_length=50)),
                ('valide', models.BooleanField(default=False)),
                ('observations', models.CharField(blank=True, max_length=255)),
                ('valide_le', models.DateTimeField(blank=True, null=True)),
                ('contrat', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='pieces', to='dossiers.contrat')),
                ('valide_par', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    to=settings.AUTH_USER_MODEL)),
            ],
            options={'db_table': 'pieces_contrat', 'verbose_name': 'Pièce de contrat'},
        ),
        migrations.AlterUniqueTogether(
            name='piececontrat',
            unique_together={('contrat', 'code_piece')},
        ),
    ]