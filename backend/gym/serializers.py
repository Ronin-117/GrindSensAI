from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, TrainingRoutine, WeeklyScheduleItem, Exercise,WorkoutPlan, TrainingRoutine,DailyWorkoutLog


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
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True) 
    last_name = serializers.CharField(source='user.last_name', read_only=True) 
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'username', 'email', 'first_name', 'last_name', 'bio', 'age', 'height','weight'] 
        read_only_fields = ['user','username', 'email'] 


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
    
##############################

class WorkoutPlanSerializer(serializers.ModelSerializer):
    heat_level = serializers.IntegerField(read_only=True) # From @property
    username = serializers.CharField(source='user.username', read_only=True)

    # To show details of the current routine when GETTING the plan
    current_routine_details = TrainingRoutineSerializer(source='current_routine', read_only=True, allow_null=True)

    # To ACCEPT a routine ID when UPDATING the plan
    # We use PrimaryKeyRelatedField to accept the ID of the TrainingRoutine
    current_routine = serializers.PrimaryKeyRelatedField(
        queryset=TrainingRoutine.objects.all(), # Or a more filtered queryset if needed
        allow_null=True, # Allow setting it to null (deselect routine)
        required=False # Not required for every update to WorkoutPlan
    )

    class Meta:
        model = WorkoutPlan
        fields = [
            'id',
            'user',
            'username',
            'current_routine',          # This field will be used for PATCH/PUT (expects routine ID)
            'current_routine_details',  # This field will be used for GET (shows serialized routine)
            'heat_level',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['user', 'username', 'heat_level', 'created_at', 'updated_at', 'current_routine_details']

class MinimalExerciseSerializer(serializers.ModelSerializer): # For nesting inside schedule
    class Meta:
        model = Exercise
        fields = ['id', 'exercise_name', 'target_muscles', 'sets', 'reps_or_duration', 'notes']

class MinimalWeeklyScheduleItemSerializer(serializers.ModelSerializer): # For nesting
    exercises = MinimalExerciseSerializer(many=True, read_only=True)
    class Meta:
        model = WeeklyScheduleItem
        fields = ['id', 'day_of_week_or_number', 'session_focus', 'exercises']

class DailyWorkoutLogSerializer(serializers.ModelSerializer):
    # This field is intended for writing the WorkoutPlan ID
    workout_plan = serializers.PrimaryKeyRelatedField( # Renamed from workout_plan_id to match model field
        queryset=WorkoutPlan.objects.all(),
        # No 'source' needed if the serializer field name matches the model field name
    )
    # To show user for context (optional, as it's via workout_plan)
    username = serializers.CharField(source='workout_plan.user.username', read_only=True, allow_null=True)
    routine_name_from_plan = serializers.CharField(source='workout_plan.current_routine.routine_name', read_only=True, allow_null=True)


    class Meta:
        model = DailyWorkoutLog
        fields = [
            'id',
            'workout_plan',         # Now this refers to the PrimaryKeyRelatedField above.
                                    # It will accept an ID on write and return an ID on read.
            'username',             # For context
            'routine_name_from_plan',# For context
            'date',
            'routine_log_name',
            'routine_used',         # This is the ID of the TrainingRoutine model
            'logged_exercises',
            'completion_percentage',
            'session_notes'
        ]
        read_only_fields = ['id', 'username', 'routine_name_from_plan']

    def validate_logged_exercises(self, value):
        # Optional: Add custom validation for the structure of logged_exercises
        if not isinstance(value, list):
            raise serializers.ValidationError("logged_exercises must be a list.")
        for item in value:
            if not isinstance(item, dict):
                raise serializers.ValidationError("Each item in logged_exercises must be a dictionary.")
            # Add more checks for required keys like 'original_exercise_id', 'exercise_name', etc.
            if 'exercise_name' not in item or 'target_sets' not in item:
                 raise serializers.ValidationError("Exercise item missing required fields (e.g., exercise_name, target_sets).")
        return value

    def validate_completion_percentage(self, value):
        if not (0 <= value <= 100):
            raise serializers.ValidationError("Completion percentage must be between 0 and 100.")
        return value