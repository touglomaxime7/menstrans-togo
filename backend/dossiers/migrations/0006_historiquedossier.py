from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('dossiers', '0005_merge_20260623_1952'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='HistoriqueDossier',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True,
                                           serialize=False, verbose_name='ID')),
                ('statut_avant',    models.CharField(blank=True, max_length=30)),
                ('statut_apres',    models.CharField(max_length=30)),
                ('date_changement', models.DateTimeField(auto_now_add=True)),
                ('commentaire',     models.TextField(blank=True)),
                ('duree_jours',     models.IntegerField(default=0)),
                ('dossier', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='historique',
                    to='dossiers.dossier')),
                ('utilisateur', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='historique_dossiers',
                    to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table':     'historique_dossiers',
                'ordering':     ['date_changement'],
                'verbose_name': 'Historique dossier',
            },
        ),
    ]