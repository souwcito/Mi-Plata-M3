# 🏦 Banco Mi Plata — Sistema Bancario Digital (POO)

Proyecto integral desarrollado para la asignatura **Frontend I (2do Semestre — Cesde)** aplicando los pilares de la **Programación Orientada a Objetos (POO)** en JavaScript, modelado con base en las normas de la banca financiera real colombiana y diseñado con una interfaz futurista y profesional en tonalidades estrictamente azules.

---

## 🚀 Repositorio Oficial
* **GitHub:** [https://github.com/souwcito/Mi-Plata-M3.git](https://github.com/souwcito/Mi-Plata-M3.git)

---

## 🏛️ 1. Arquitectura de Clases (POO)

El sistema implementa de forma rigurosa los cuatro pilares fundamentales de la Programación Orientada a Objetos: **Abstracción, Encapsulamiento, Herencia y Polimorfismo**.

```
              ┌───────────────────────────┐
              │          Cliente          │
              ├───────────────────────────┤
              │ - id / cedula: String     │
              │ - nombre: String          │
              │ - celular: String         │
              │ - usuario: String         │
              │ - clave: String           │
              │ - cuentas: Array<Cuenta>  │
              ├───────────────────────────┤
              │ + registrar()             │
              │ + autenticar()            │
              │ + actualizarDatos()       │
              └─────────────┬─────────────┘
                            │ 1
                            ▼ 1..*
              ┌───────────────────────────┐
              │   <<Abstract>> Cuenta     │
              ├───────────────────────────┤
              │ # numero: String          │
              │ # saldo: Number           │
              │ # movimientos: Array      │
              ├───────────────────────────┤
              │ + consultarSaldo()        │
              │ + consignar(monto)        │
              │ + retirar(monto): abstract│
              │ + transferir()            │
              │ + registrarMovimiento()   │
              └─────────────┬─────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────────┐
│  CuentaAhorros   │ │  CuentaCorriente │ │      TarjetaCredito      │
├──────────────────┤ ├──────────────────┤ ├──────────────────────────┤
│ - tasaInteres:   │ │- sobregiro:      │ │ - cupoCredito: Number    │
│   0.015 (1.5%)   │ │  0.20 (20%)      │ │ - deudaTotal: Number     │
├──────────────────┤ ├──────────────────┤ │ - compras: Array         │
│ + retirar(monto) │ │ + retirar(monto) │ ├──────────────────────────┤
│   // aplica 1.5% │ │   // sobregiro   │ │ + calcularCuota()        │
│   interés retiro │ │   hasta saldo+20%│ │ + generarTablaAmortizac()│
└──────────────────┘ └──────────────────┘ │ + comprar()              │
                                          │ + pagarCuotaCompra()     │
                                          │ + pagarTotalidadCompra() │
                                          └──────────────────────────┘
```

---

## 📐 2. Lógica Matemática Financiera y Criterios de Aceptación

### 💼 Cuenta Corriente con Sobregiro (HU-02)
* **Regla:** El cliente puede disponer de sus fondos y sobregirarse hasta un **20% adicional** sobre su saldo positivo.
* **Fórmula de Límite de Retiro:**
  $$\text{Límite Máximo} = \text{Saldo} \times (1 + 0.20) = \text{Saldo} \times 1.20$$
* **Casos:**
  1. Si $\text{Monto} \le \text{Saldo}$: Se descuenta normalmente, saldo resultante $\ge 0$.
  2. Si $\text{Saldo} < \text{Monto} \le \text{Límite}$: Se autoriza el sobregiro; la cuenta queda con saldo negativo (en rojo/sobregiro) y se registra el monto exacto del sobregiro prestado por el banco.
  3. Si $\text{Monto} > \text{Límite}$: Transacción rechazada automáticamente por exceder el 20% permitido.
  4. Al consignar cuando el saldo es negativo, el depósito amortiza primero la deuda de sobregiro.

### 🏦 Cuenta de Ahorros con Interés por Retiro (HU-03)
* **Regla:** No permite sobregiro. Al retirar fondos, el banco aplica una tarifa/interés del **1.5% mensual** al momento de la disposición.
* **Fórmula:**
  $$\text{Interés Bancario} = \text{Monto} \times 0.015$$
  $$\text{Total Debitado} = \text{Monto} + \text{Interés Bancario}$$
* **Condición de Aprobación:** $\text{Total Debitado} \le \text{Saldo Disponible}$.
* Si el saldo es insuficiente para cubrir el monto más el 1.5%, se rechaza y se le informa al usuario su capacidad máxima de retiro:
  $$\text{Máximo Retirable} = \frac{\text{Saldo}}{1 + 0.015}$$

### 💳 Tarjeta de Crédito con Amortización Francesa (HU-04)
* **Cupo Base Asignado:** \$2,000,000 COP.
* **Tasas de Interés según Plazo:**
  * **1 a 2 Cuotas:** **0.0% de interés** mensual.
  * **3 a 6 Cuotas:** **1.9% de interés** mensual vencido ($i = 0.019$).
  * **7 a 36 Cuotas:** **2.3% de interés** mensual vencido ($i = 0.023$).
* **Fórmula Matemática Bancaria (Sistema Francés — Cuota Fija):**
  $$C = \frac{P \cdot i}{1 - (1 + i)^{-n}}$$
  *Donde $P$ es el capital financiado, $i$ la tasa mensual periódica y $n$ el número de cuotas.*
* **Visualización de Cuotas y Amortización Real:**
  * Para cada compra se calcula y desglosa en tiempo real:
    1. Cuota mensual fija.
    2. Total a pagar financiado ($C \times n$).
    3. Total intereses que devenga el banco.
    4. **Tabla de Amortización completa:** Mes a mes con Saldo Inicial, Cuota Total, Abono a Capital, Abono a Interés, Saldo Final y Estado (Pagada / Pendiente).
  * **Pagos de Tarjeta:** El cliente puede:
    * Pagar la cuota mensual de una compra específica con débito de su Cuenta de Ahorros o Corriente.
    * Pagar la totalidad de una compra anticipadamente (condonando los intereses futuros no causados).
    * Realizar abonos libres a la deuda total, liberando cupo disponible al instante.

### 🔄 Transferencias entre Cuentas (HU-05)
* Valida saldo suficiente en la cuenta de origen.
* Impide transferir a la misma cuenta de origen.
* Permite transferir entre productos propios (Ahorros $\leftrightarrow$ Corriente) o hacia otros clientes registrados mediante Cédula o Nombre de Usuario.
* Actualiza saldos y registra movimientos correlativos en ambas cuentas.

---

## 🎨 3. Diseño Visual Futurista (Estrictamente Tonos Azules)
Siguiendo las especificaciones del proyecto:
* **Paleta Cromática:** 100% gama de azules (Deep Midnight `#030712`, Sapphire Blue `#174b9e`, Oceanic Cobalt `#0c2552`, Titanium Blue `#103273`, Electric Blue `#2563eb`, Cyan Neón `#00f0ff` e Ice Blue `#e0f2fe`).
* **Efectos:** Glassmorphism con bordes brillantes, tarjeta 3D holográfica interactiva, rejilla cuántica de fondo y barras dinámicas de progreso de crédito.

---

## 📂 4. Estructura del Proyecto

```
Mi Plata/
├── css/
│   └── style.css                    # Estilos CSS futuristas (Paleta exclusiva de azules)
├── html/
│   └── index.html                   # Interfaz web principal y componentes bancarios
├── js/
│   ├── funciones.js                 # Lógica POO, cálculos matemáticos y controladores DOM
│   └── script.js                    # Copia sincronizada del motor transaccional
├── Diagrama.png                     # Diagrama UML oficial de la arquitectura POO
├── HistoriasUsuarioMiPlata.pdf      # Documento oficial de Historias de Usuario (HU-01 a HU-05)
├── .gitignore                       # Ignora archivos .drawio y temporales
└── README.md                        # Documentación técnica completa del proyecto
```

---

## 👨‍💻 Autor
* **Estudiante:** Mateo S.
* **Materia:** Frontend I
* **Institución:** Cesde
