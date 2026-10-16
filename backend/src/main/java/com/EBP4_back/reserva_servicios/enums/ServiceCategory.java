package com.EBP4_back.reserva_servicios.enums;

public enum ServiceCategory {
    CONSULTA_GENERAL("Consulta general"),
    VACUNACION("Vacunacion"),
    DESPARASITACION("Desparasitacion"),
    PELUQUERIA("Peluqueria y estetica"),
    CIRUGIA("Cirugia"),
    ODONTOLOGIA("Odontologia"),
    LABORATORIO("Laboratorio e imagenes"),
    URGENCIAS("Urgencias"),
    OTROS("Otros");

    private final String label;

    ServiceCategory(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
