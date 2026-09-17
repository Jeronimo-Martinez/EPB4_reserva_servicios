package com.EBP4_back.reserva_servicios.enums;

public enum ServiceCategory {
    SALUD_Y_BIENESTAR("Salud y Bienestar"),
    BELLEZA("Belleza"),
    HOGAR("Hogar"),
    EDUCACION("Educacion"),
    TECNOLOGIA("Tecnologia"),
    GASTRONOMIA("Gastronomia"),
    OTROS("Otros");

    private final String label;

    ServiceCategory(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
