# Generated migration for GitHub integration enhancements
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('db', '0107_migrate_filters_to_rich_filters'),
    ]

    operations = [
        # Add new fields to GithubRepositorySync
        migrations.AddField(
            model_name='githubrepositorysynс',
            name='sync_direction',
            field=models.CharField(
                choices=[
                    ('unidirectional', 'Unidirectional (GitHub -> Plane)'),
                    ('bidirectional', 'Bidirectional')
                ],
                default='unidirectional',
                max_length=20
            ),
        ),
        migrations.AddField(
            model_name='githubrepositorysynс',
            name='github_open_state',
            field=models.ForeignKey(
                blank=True,
                help_text='Plane state to map when GitHub issue is opened',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='github_open_syncs',
                to='db.state'
            ),
        ),
        migrations.AddField(
            model_name='githubrepositorysynс',
            name='github_closed_state',
            field=models.ForeignKey(
                blank=True,
                help_text='Plane state to map when GitHub issue is closed',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='github_closed_syncs',
                to='db.state'
            ),
        ),

        # Create GithubUserConnection model
        migrations.CreateModel(
            name='GithubUserConnection',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Last Modified At')),
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('github_user_id', models.BigIntegerField()),
                ('github_username', models.CharField(max_length=255)),
                ('github_email', models.EmailField(blank=True, max_length=254, null=True)),
                ('github_avatar_url', models.URLField(blank=True, null=True)),
                ('access_token', models.TextField()),
                ('refresh_token', models.TextField(blank=True, null=True)),
                ('token_expires_at', models.DateTimeField(blank=True, null=True)),
                ('scopes', models.TextField(default='')),
                ('metadata', models.JSONField(default=dict)),
                ('created_by', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='%(class)s_created_by',
                    to='db.user',
                    verbose_name='Created By'
                )),
                ('updated_by', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='%(class)s_updated_by',
                    to='db.user',
                    verbose_name='Last Modified By'
                )),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='github_connections',
                    to='db.user'
                )),
                ('workspace', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='github_user_connections',
                    to='db.workspace'
                )),
                ('workspace_integration', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='user_connections',
                    to='db.workspaceintegration'
                )),
            ],
            options={
                'verbose_name': 'Github User Connection',
                'verbose_name_plural': 'Github User Connections',
                'db_table': 'github_user_connections',
                'ordering': ('-created_at',),
                'unique_together': {('user', 'workspace')},
            },
        ),

        # Create GithubPRStateMapping model
        migrations.CreateModel(
            name='GithubPRStateMapping',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Last Modified At')),
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('created_by', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='%(class)s_created_by',
                    to='db.user',
                    verbose_name='Created By'
                )),
                ('updated_by', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='%(class)s_updated_by',
                    to='db.user',
                    verbose_name='Last Modified By'
                )),
                ('project', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='%(class)s_project',
                    to='db.project'
                )),
                ('workspace', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='%(class)s_workspace',
                    to='db.workspace'
                )),
                ('workspace_integration', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='pr_state_mappings',
                    to='db.workspaceintegration'
                )),
                ('repository', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='pr_state_mappings',
                    to='db.githubrepository'
                )),
                ('pr_draft_state', models.ForeignKey(
                    blank=True,
                    help_text='Plane state when PR is in draft',
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='pr_draft_mappings',
                    to='db.state'
                )),
                ('pr_opened_state', models.ForeignKey(
                    blank=True,
                    help_text='Plane state when PR is opened',
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='pr_opened_mappings',
                    to='db.state'
                )),
                ('pr_review_requested_state', models.ForeignKey(
                    blank=True,
                    help_text='Plane state when review is requested',
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='pr_review_requested_mappings',
                    to='db.state'
                )),
                ('pr_approved_state', models.ForeignKey(
                    blank=True,
                    help_text='Plane state when PR is approved',
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='pr_approved_mappings',
                    to='db.state'
                )),
                ('pr_merged_state', models.ForeignKey(
                    blank=True,
                    help_text='Plane state when PR is merged',
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='pr_merged_mappings',
                    to='db.state'
                )),
                ('pr_closed_state', models.ForeignKey(
                    blank=True,
                    help_text='Plane state when PR is closed without merging',
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='pr_closed_mappings',
                    to='db.state'
                )),
            ],
            options={
                'verbose_name': 'Github PR State Mapping',
                'verbose_name_plural': 'Github PR State Mappings',
                'db_table': 'github_pr_state_mappings',
                'ordering': ('-created_at',),
                'unique_together': {('project', 'repository')},
            },
        ),

        # Create GithubPRSync model
        migrations.CreateModel(
            name='GithubPRSync',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Last Modified At')),
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('pr_number', models.IntegerField()),
                ('pr_id', models.BigIntegerField()),
                ('pr_url', models.URLField()),
                ('pr_title', models.TextField()),
                ('pr_state', models.CharField(max_length=20)),
                ('metadata', models.JSONField(default=dict)),
                ('created_by', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='%(class)s_created_by',
                    to='db.user',
                    verbose_name='Created By'
                )),
                ('updated_by', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='%(class)s_updated_by',
                    to='db.user',
                    verbose_name='Last Modified By'
                )),
                ('project', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='%(class)s_project',
                    to='db.project'
                )),
                ('workspace', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='%(class)s_workspace',
                    to='db.workspace'
                )),
                ('repository', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='pr_syncs',
                    to='db.githubrepository'
                )),
                ('linked_issues', models.ManyToManyField(
                    blank=True,
                    related_name='github_pr_syncs',
                    to='db.issue'
                )),
            ],
            options={
                'verbose_name': 'Github PR Sync',
                'verbose_name_plural': 'Github PR Syncs',
                'db_table': 'github_pr_syncs',
                'ordering': ('-created_at',),
                'unique_together': {('repository', 'pr_id')},
            },
        ),
    ]
