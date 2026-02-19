"""Vehicle model – inherits TenantAwareModel (which provides soft-delete)."""

from __future__ import annotations

from typing import ClassVar

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from tenants.models import TenantAwareModel


class FuelType(models.TextChoices):
    DIESEL = "diesel", "Diesel"
    PETROL = "petrol", "Petrol"
    ELECTRIC = "electric", "Electric"
    HYBRID = "hybrid", "Hybrid"


class VehicleStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    MAINTENANCE = "maintenance", "Maintenance"
    OUT_OF_SERVICE = "out_of_service", "Out of Service"
    SOLD = "sold", "Sold"


# Allowed status transitions – Sold is terminal.
VALID_STATUS_TRANSITIONS: dict[str, list[str]] = {
    VehicleStatus.ACTIVE: [VehicleStatus.MAINTENANCE, VehicleStatus.OUT_OF_SERVICE, VehicleStatus.SOLD],
    VehicleStatus.MAINTENANCE: [VehicleStatus.ACTIVE, VehicleStatus.OUT_OF_SERVICE, VehicleStatus.SOLD],
    VehicleStatus.OUT_OF_SERVICE: [VehicleStatus.ACTIVE, VehicleStatus.MAINTENANCE, VehicleStatus.SOLD],
    VehicleStatus.SOLD: [],  # terminal
}


class Vehicle(TenantAwareModel):
    """A vehicle belonging to a tenant's fleet."""

    make = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.PositiveIntegerField()
    license_plate = models.CharField(max_length=30)
    vin = models.CharField(max_length=50, blank=True)
    fuel_type = models.CharField(max_length=20, choices=FuelType.choices)
    status = models.CharField(max_length=20, choices=VehicleStatus.choices, default=VehicleStatus.ACTIVE)
    current_mileage = models.PositiveIntegerField(default=0)
    baseline_fuel_consumption = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    assigned_driver = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_vehicle",
    )

    class Meta:
        db_table = "fleet_vehicle"
        constraints: ClassVar[list] = [
            models.UniqueConstraint(
                fields=["tenant", "license_plate"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_license_plate_per_tenant",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.make} {self.model} ({self.license_plate})"

    @property
    def documents_active(self):
        """Return non-deleted documents for this vehicle."""
        return self.documents.filter(deleted_at__isnull=True)

    def transition_status(self, new_status: str) -> None:
        """Transition to *new_status* if allowed, else raise ValidationError."""
        allowed = VALID_STATUS_TRANSITIONS.get(self.status, [])
        if new_status not in allowed:
            msg = f"Cannot transition from '{self.status}' to '{new_status}'."
            raise ValidationError(msg)
        old_status = self.status
        self.status = new_status
        self.save(update_fields=["status"])
        # Record in history
        StatusHistory.objects.create(vehicle=self, old_status=old_status, new_status=new_status, tenant=self.tenant)


class StatusHistory(TenantAwareModel):
    """Tracks every status change for a vehicle."""

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name="status_history")
    old_status = models.CharField(max_length=20, choices=VehicleStatus.choices)
    new_status = models.CharField(max_length=20, choices=VehicleStatus.choices)

    class Meta:
        db_table = "fleet_status_history"
        ordering: ClassVar[list[str]] = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.vehicle} : {self.old_status} → {self.new_status}"


class VehicleDocument(TenantAwareModel):
    """Documents attached to a vehicle (registration, insurance, etc.)."""

    class DocumentType(models.TextChoices):
        REGISTRATION = "registration", "Registration"
        INSURANCE = "insurance", "Insurance"
        INSPECTION = "inspection", "Inspection"
        OTHER = "other", "Other"

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name="documents")
    document_type = models.CharField(max_length=20, choices=DocumentType.choices)
    title = models.CharField(max_length=255)
    file_url = models.URLField(blank=True)
    expiry_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "fleet_vehicle_document"
        ordering: ClassVar[list[str]] = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.title} ({self.document_type})"

    @property
    def is_overdue(self) -> bool:
        """True if the document has an expiry date in the past."""
        if self.expiry_date is None:
            return False
        from django.utils import timezone

        return self.expiry_date < timezone.now().date()
