# Generated by Django 5.1.7 on 2025-05-24 07:00

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("gym", "0001_initial"),
    ]

    operations = [
        migrations.RenameField(
            model_name="userprofile",
            old_name="hight",
            new_name="height",
        ),
    ]
