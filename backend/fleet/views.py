"""Fleet app views — Vehicle CRUD, status, driver, mileage, documents."""

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from authentication.models import Role, User
from authentication.permissions import IsTenantMember
from fleet.models import Vehicle, VehicleDocument
from fleet.serializers import (
    DriverAssignSerializer,
    MileageSerializer,
    VehicleDetailSerializer,
    VehicleDocumentSerializer,
    VehicleSerializer,
    VehicleStatusSerializer,
)


class VehicleViewSet(viewsets.ModelViewSet):
    """
    CRUD for vehicles, scoped to the requesting user's tenant.
    Includes custom actions for status transitions, driver assignment,
    and mileage updates.
    """

    permission_classes = [IsTenantMember]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "fuel_type"]
    search_fields = ["make", "model", "license_plate"]
    ordering_fields = ["make", "year", "created_at"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return VehicleDetailSerializer
        return VehicleSerializer

    def get_queryset(self):
        return (
            Vehicle.objects.active()
            .for_tenant(self.request.user.tenant)
            .select_related("assigned_driver")
        )

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)

    # DELETE → soft-delete
    def perform_destroy(self, instance):
        instance.soft_delete()

    # POST /vehicles/{id}/restore/
    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        vehicle = Vehicle.objects.filter(
            pk=pk, tenant=request.user.tenant, deleted_at__isnull=False,
        ).first()
        if not vehicle:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        vehicle.restore()
        return Response(VehicleSerializer(vehicle).data)

    # PATCH /vehicles/{id}/status/
    @action(detail=True, methods=["patch"], url_path="status")
    def change_status(self, request, pk=None):
        vehicle = self.get_object()
        serializer = VehicleStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            vehicle.transition_status(serializer.validated_data["status"])
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(VehicleSerializer(vehicle).data)

    # PATCH /vehicles/{id}/assign-driver/
    @action(detail=True, methods=["patch"], url_path="assign-driver")
    def assign_driver(self, request, pk=None):
        vehicle = self.get_object()
        serializer = DriverAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        driver_id = serializer.validated_data["driver_id"]
        try:
            driver = User.objects.get(
                pk=driver_id, tenant=request.user.tenant, role=Role.DRIVER,
            )
        except User.DoesNotExist:
            return Response({"detail": "Driver not found."}, status=status.HTTP_404_NOT_FOUND)
        # Check if driver is already assigned elsewhere
        existing = Vehicle.objects.active().filter(
            assigned_driver=driver, tenant=request.user.tenant,
        ).exclude(pk=vehicle.pk).first()
        if existing:
            return Response(
                {"detail": f"Driver already assigned to {existing}."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        vehicle.assigned_driver = driver
        vehicle.save(update_fields=["assigned_driver"])
        return Response(VehicleSerializer(vehicle).data)

    # PATCH /vehicles/{id}/unassign-driver/
    @action(detail=True, methods=["patch"], url_path="unassign-driver")
    def unassign_driver(self, request, pk=None):
        vehicle = self.get_object()
        vehicle.assigned_driver = None
        vehicle.save(update_fields=["assigned_driver"])
        return Response(VehicleSerializer(vehicle).data)

    # PATCH /vehicles/{id}/mileage/
    @action(detail=True, methods=["patch"], url_path="mileage")
    def update_mileage(self, request, pk=None):
        vehicle = self.get_object()
        serializer = MileageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vehicle.current_mileage = serializer.validated_data["mileage"]
        vehicle.save(update_fields=["current_mileage"])
        return Response(VehicleSerializer(vehicle).data)


class VehicleDocumentViewSet(viewsets.ModelViewSet):
    """CRUD for vehicle documents, nested under a vehicle."""

    serializer_class = VehicleDocumentSerializer
    permission_classes = [IsTenantMember]

    def get_queryset(self):
        return (
            VehicleDocument.objects.active()
            .filter(
                vehicle_id=self.kwargs["vehicle_pk"],
                vehicle__tenant=self.request.user.tenant,
            )
        )

    def perform_create(self, serializer):
        vehicle = Vehicle.objects.active().get(
            pk=self.kwargs["vehicle_pk"],
            tenant=self.request.user.tenant,
        )
        serializer.save(tenant=self.request.user.tenant, vehicle=vehicle)

    def perform_destroy(self, instance):
        instance.soft_delete()
