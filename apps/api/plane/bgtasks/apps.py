from django.apps import AppConfig


class BgtasksConfig(AppConfig):
    name = "plane.bgtasks"

    def ready(self):
        # Import signal handlers to register them
        import plane.bgtasks.automation_executor  # noqa
