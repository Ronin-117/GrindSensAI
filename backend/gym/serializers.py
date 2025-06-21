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

class WeeklyScheduleItemSerializer(serializers.ModelSerializer):
    exercises = ExerciseSerializer(many=True) 

    class Meta:
        model = WeeklyScheduleItem
        fields = ['id', 'day_of_week_or_number', 'session_focus', 'exercises']

class TrainingRoutineSerializer(serializers.ModelSerializer):
    weekly_schedule = WeeklyScheduleItemSerializer(many=True)
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
        instance.routine_id = validated_data.get('routine_id', instance.routine_id)
        instance.routine_name = validated_data.get('routine_name', instance.routine_name)
        instance.goal = validated_data.get('goal', instance.goal)
        instance.coach_response = validated_data.get('coach_response', instance.coach_response)
        instance.save()

        weekly_schedule_data = validated_data.pop('weekly_schedule', None)
        if weekly_schedule_data is not None:
            instance.weekly_schedule.all().delete() 

            for schedule_item_data in weekly_schedule_data:
                exercises_data = schedule_item_data.pop('exercises', [])
                schedule_item = WeeklyScheduleItem.objects.create(routine=instance, **schedule_item_data)
                for exercise_data in exercises_data:
                    Exercise.objects.create(schedule_item=schedule_item, **exercise_data)
        return instance
    
##############################

class WorkoutPlanSerializer(serializers.ModelSerializer):
    heat_level = serializers.IntegerField(read_only=True) 
    username = serializers.CharField(source='user.username', read_only=True)

    current_routine_details = TrainingRoutineSerializer(source='current_routine', read_only=True, allow_null=True)

    current_routine = serializers.PrimaryKeyRelatedField(
        queryset=TrainingRoutine.objects.all(), 
        allow_null=True,
        required=False 
    )

    class Meta:
        model = WorkoutPlan
        fields = [
            'id',
            'user',
            'username',
            'current_routine',          
            'current_routine_details', 
            'heat_level',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['user', 'username', 'heat_level', 'created_at', 'updated_at', 'current_routine_details']

class MinimalExerciseSerializer(serializers.ModelSerializer): 
    class Meta:
        model = Exercise
        fields = ['id', 'exercise_name', 'target_muscles', 'sets', 'reps_or_duration', 'notes']

class MinimalWeeklyScheduleItemSerializer(serializers.ModelSerializer): 
    exercises = MinimalExerciseSerializer(many=True, read_only=True)
    class Meta:
        model = WeeklyScheduleItem
        fields = ['id', 'day_of_week_or_number', 'session_focus', 'exercises']

class DailyWorkoutLogSerializer(serializers.ModelSerializer):
    workout_plan = serializers.PrimaryKeyRelatedField( 
        queryset=WorkoutPlan.objects.all(),
    )
    username = serializers.CharField(source='workout_plan.user.username', read_only=True, allow_null=True)
    routine_name_from_plan = serializers.CharField(source='workout_plan.current_routine.routine_name', read_only=True, allow_null=True)


    class Meta:
        model = DailyWorkoutLog
        fields = [
            'id',
            'workout_plan',         
            'username',             
            'routine_name_from_plan',
            'date',
            'routine_log_name',
            'routine_used',         
            'logged_exercises',
            'completion_percentage',
            'session_notes'
        ]
        read_only_fields = ['id', 'username', 'routine_name_from_plan']

    def validate_logged_exercises(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("logged_exercises must be a list.")
        for item in value:
            if not isinstance(item, dict):
                raise serializers.ValidationError("Each item in logged_exercises must be a dictionary.")
            if 'exercise_name' not in item or 'target_sets' not in item:
                 raise serializers.ValidationError("Exercise item missing required fields (e.g., exercise_name, target_sets).")
        return value

    def validate_completion_percentage(self, value):
        if not (0 <= value <= 100):
            raise serializers.ValidationError("Completion percentage must be between 0 and 100.")
        return value