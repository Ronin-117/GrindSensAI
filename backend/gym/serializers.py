from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, TrainingRoutine, WeeklyScheduleItem, Exercise


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'bio', 'age', 'height','weight'] 
        read_only_fields = ['user'] 


#######################################################################################

class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ['id', 'exercise_name', 'target_muscles', 'sets', 'reps_or_duration', 'rest_period', 'notes']
        # `schedule_item` will be handled by the parent

class WeeklyScheduleItemSerializer(serializers.ModelSerializer):
    exercises = ExerciseSerializer(many=True) # Nested exercises

    class Meta:
        model = WeeklyScheduleItem
        fields = ['id', 'day_of_week_or_number', 'session_focus', 'exercises']
        # `routine` will be handled by the parent

class TrainingRoutineSerializer(serializers.ModelSerializer):
    weekly_schedule = WeeklyScheduleItemSerializer(many=True)
    # To show username in the response (read-only)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = TrainingRoutine
        fields = [
            'id', 'user', 'username', 'routine_id', 'routine_name', 'goal', 'experience_level',
            'training_split', 'days_per_week', 'description', 'weekly_schedule',
            'cardio_guidelines', 'flexibility_guidelines', 'precautions', 'coach_response',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'username', 'created_at', 'updated_at'] # User is set via perform_create

    def create(self, validated_data):
        weekly_schedule_data = validated_data.pop('weekly_schedule', [])
        routine = TrainingRoutine.objects.create(**validated_data)

        for schedule_item_data in weekly_schedule_data:
            exercises_data = schedule_item_data.pop('exercises', [])
            schedule_item = WeeklyScheduleItem.objects.create(routine=routine, **schedule_item_data)
            for exercise_data in exercises_data:
                Exercise.objects.create(schedule_item=schedule_item, **exercise_data)
        return routine

    def update(self, instance, validated_data):
        # Basic update for TrainingRoutine fields
        instance.routine_id = validated_data.get('routine_id', instance.routine_id)
        instance.routine_name = validated_data.get('routine_name', instance.routine_name)
        instance.goal = validated_data.get('goal', instance.goal)
        # ... update other TrainingRoutine fields ...
        instance.coach_response = validated_data.get('coach_response', instance.coach_response)
        instance.save()

        # For nested updates, it's more complex:
        # You need to decide how to handle existing vs. new schedule items/exercises.
        # Options:
        # 1. Delete all existing children and recreate (simplest for full replacement).
        # 2. Match by ID and update, create new ones, delete ones not provided.
        # For now, let's demonstrate a simple approach: clear and recreate weekly_schedule
        # This is NOT ideal for partial updates but shows the concept.
        # Consider using a library like `drf-writable-nested` for robust nested updates.

        weekly_schedule_data = validated_data.pop('weekly_schedule', None)
        if weekly_schedule_data is not None: # Only update if 'weekly_schedule' is in payload
            # Clear existing schedule items and their exercises
            instance.weekly_schedule.all().delete() # This cascades to exercises

            for schedule_item_data in weekly_schedule_data:
                exercises_data = schedule_item_data.pop('exercises', [])
                schedule_item = WeeklyScheduleItem.objects.create(routine=instance, **schedule_item_data)
                for exercise_data in exercises_data:
                    Exercise.objects.create(schedule_item=schedule_item, **exercise_data)
        return instance