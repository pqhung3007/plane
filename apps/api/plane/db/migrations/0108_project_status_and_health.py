# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('db', '0107_migrate_filters_to_rich_filters'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='status',
            field=models.CharField(
                blank=True,
                choices=[
                    ('draft', 'Draft'),
                    ('planning', 'Planning'),
                    ('execution', 'Execution'),
                    ('monitoring', 'Monitoring'),
                    ('completed', 'Completed'),
                    ('cancelled', 'Cancelled'),
                ],
                default='planning',
                max_length=20,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='project',
            name='health',
            field=models.CharField(
                blank=True,
                choices=[
                    ('on_track', 'On Track'),
                    ('off_track', 'Off Track'),
                    ('at_risk', 'At Risk'),
                ],
                max_length=20,
                null=True,
            ),
        ),
    ]
