"""Serializers for the fleet app — vehicles, documents, status history."""

from rest_framework import serializers

from authentication.models import User
from fleet.models import DriverProfile, StatusHistory, Vehicle, VehicleDocument


class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = [
            "id",
            "make",
            "model",
            "year",
            "license_plate",
            "vin",
            "fuel_type",
            "status",
            "current_mileage",
            "baseline_fuel_consumption",
            "assigned_driver",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "status", "created_at", "updated_at"]

    def validate_license_plate(self, value):
        """Check for duplicate plate within current tenant (excluding soft-deleted)."""
        request = self.context.get("request")
        if not request:
            return value
        qs = Vehicle.objects.active().filter(
            tenant=request.user.tenant, license_plate=value,
        )
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A vehicle with this license plate already exists.")
        return value


class VehicleStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Vehicle._meta.get_field("status").choices)


class DriverAssignSerializer(serializers.Serializer):
    driver_id = serializers.IntegerField()


class MileageSerializer(serializers.Serializer):
    mileage = serializers.IntegerField(min_value=0)


class StatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = StatusHistory
        fields = ["id", "old_status", "new_status", "created_at"]
        read_only_fields = fields


class VehicleDocumentSerializer(serializers.ModelSerializer):
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = VehicleDocument
        fields = [
            "id",
            "document_type",
            "title",
            "file_url",
            "expiry_date",
            "is_overdue",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "is_overdue", "created_at", "updated_at"]


class VehicleDetailSerializer(VehicleSerializer):
    """Extends VehicleSerializer with nested documents and status history."""

    documents = VehicleDocumentSerializer(many=True, read_only=True, source="documents_active")
    status_history = StatusHistorySerializer(many=True, read_only=True)
    assigned_driver_email = serializers.EmailField(source="assigned_driver.email", read_only=True, default=None)

    class Meta(VehicleSerializer.Meta):
        fields = [*VehicleSerializer.Meta.fields, "documents", "status_history", "assigned_driver_email"]


class UserSerializer(serializers.ModelSerializer):
    """Basic user serializer for nested driver profile data."""

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "role"]
        read_only_fields = fields


class DriverProfileSerializer(serializers.ModelSerializer):
    """Serializer for driver profiles with nested user data."""

    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source="user",
        write_only=True,
    )

    class Meta:
        model = DriverProfile
        fields = [
            "id",
            "user",
            "user_id",
            "license_number",
            "license_expiry",
            "license_class",
            "date_of_birth",
            "emergency_contact_name",
            "emergency_contact_phone",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]
