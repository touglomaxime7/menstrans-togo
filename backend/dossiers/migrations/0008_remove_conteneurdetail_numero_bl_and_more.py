from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dossiers', '0007_update_pieces_requises'),
    ]

    operations = [
        migrations.AddField(
            model_name='conteneurdetail',
            name='numero_conteneur',
            field=models.CharField(blank=True, max_length=50, verbose_name='N° Conteneur'),
        ),
        migrations.AlterField(
            model_name='historiquedossier',
            name='duree_jours',
            field=models.IntegerField(default=0),
        ),
    ]