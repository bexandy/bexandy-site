---
title: Guard Hub · gestión de guardias
summary: "API, portal web y app para empresas de seguridad: turnos, facturación, trabajadores, pagos y casos."
date: 2026-08-24
side: work
role: Senior Backend Developer (Agencia Sur)
stack: [PHP 8, Symfony 7.4, API Platform, PostgreSQL, Vue 3, PWA, AWS, Terraform, Docker]
links: { live: https://guard-hub-web.agenciasur.cl/dashboard }
cover: cover-guard-hub
featured: true
---
Plataforma multi-empresa (tenants) para operar servicios de guardias de seguridad. El núcleo es una API en **Symfony 7.4 con API Platform** sobre PostgreSQL que cubre turnos y facturación (Guard Shift Billing), trabajadores y pagos (Workforce) y gestión de casos. Expone además un BFF para el **portal web en Vue 3** y autentica por JWT a la **PWA de guardias**, con la que cada guardia ve sus turnos, marca inicio y fin y registra novedades.

## Mi rol
Diseño del dominio y de la API, migraciones y datos demo, entorno local reproducible con un solo comando (API, portal, app y correo de pruebas) y despliegue en AWS con Terraform. Código privado de Agencia Sur.
