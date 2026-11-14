// ==========================================
// BANCO MI PLATA — SISTEMA TRANSACCIONAL POO
// ==========================================

// ==========================================
// 1. CLASES BASE (PROGRAMACIÓN ORIENTADA A OBJETOS)
// ==========================================

/**
 * Clase base abstracta Cuenta (Abstracción y Encapsulamiento)
 * Cumple con el Diagrama UML del Banco Mi Plata
 */
class Cuenta {
    constructor(numero, saldoInicial = 0) {
        this.numero = numero;
        this.saldo = Number(saldoInicial) || 0;
        this.movimientos = [];
    }

    consultarSaldo() {
        return this.saldo;
    }

    consignar(monto) {
        const valor = Number(monto);
        if (valor > 0) {
            this.saldo += valor;
            this.registrarMovimiento("Consignación", valor);
            return true;
        }
        return false;
    }

    // Método que implementa cada clase hija (Polimorfismo)
    retirar(monto) {
        throw new Error("El método retirar debe ser implementado por la clase hija.");
    }

    // Método de transferencia entre cuentas (UML)
    transferir(cuentaDestino, monto, concepto = "Transferencia bancaria") {
        const valor = Number(monto);
        if (valor <= 0) {
            return { exito: false, mensaje: "El valor a transferir debe ser mayor a 0." };
        }
        if (!cuentaDestino) {
            return { exito: false, mensaje: "Cuenta de destino no válida." };
        }

        // El débito se efectúa validando según la lógica de retiro de la cuenta origen
        if (this.saldo < valor) {
            return { exito: false, mensaje: "Saldo insuficiente para realizar la transferencia." };
        }

        this.saldo -= valor;
        this.registrarMovimiento(`Transferencia enviada: ${concepto}`, valor);

        cuentaDestino.saldo += valor;
        cuentaDestino.registrarMovimiento(`Transferencia recibida: ${concepto}`, valor);

        return { exito: true, mensaje: `Transferencia realizada con éxito por $${valor.toLocaleString('es-CO')}.` };
    }

    registrarMovimiento(tipo, monto, detalleAdicional = "") {
        this.movimientos.push({
            id: "MOV-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
            fecha: new Date().toLocaleString(),
            tipo: tipo,
            monto: Number(monto),
            saldoRestante: this.saldo,
            detalle: detalleAdicional
        });
    }
}

// ==========================================
// 2. PRODUCTOS BANCARIOS (HERENCIA Y POLIMORFISMO)
// ==========================================

/**
 * Cuenta de Ahorros (HU-03 y Diagrama UML)
 * - Tasa de interés/tarifa por retiro: 1.5% (0.015)
 * - No permite sobregiro
 */
class CuentaAhorros extends Cuenta {
    constructor(numero, saldoInicial = 0) {
        super(numero, saldoInicial);
        this.tasaInteres = 0.015; // 1.5% según HU-03 y UML
    }

    retirar(monto) {
        const valor = Number(monto);
        if (isNaN(valor) || valor <= 0) {
            return { exito: false, mensaje: "Ingresa un monto de retiro válido mayor a 0." };
        }

        const interes = valor * this.tasaInteres;
        const totalADescontar = valor + interes;

        if (totalADescontar <= this.saldo) {
            this.saldo -= totalADescontar;
            this.registrarMovimiento("Retiro Cuenta de Ahorros", valor);
            this.registrarMovimiento(`Cobro Interés Retiro (${(this.tasaInteres * 100).toFixed(1)}%)`, interes);
            return {
                exito: true,
                interes: interes,
                totalDescontado: totalADescontar,
                mensaje: `Retiro exitoso por $${valor.toLocaleString('es-CO')}. Cobro de interés bancario (1.5%): $${Math.round(interes).toLocaleString('es-CO')}. Total debitado: $${Math.round(totalADescontar).toLocaleString('es-CO')}.`
            };
        } else {
            const maximoRetirable = Math.floor(this.saldo / (1 + this.tasaInteres));
            return {
                exito: false,
                mensaje: `Saldo insuficiente en Cuenta de Ahorros. Para retirar $${valor.toLocaleString('es-CO')} necesitas $${Math.round(totalADescontar).toLocaleString('es-CO')} (incluyendo el 1.5% de interés bancario: $${Math.round(interes).toLocaleString('es-CO')}). Saldo actual: $${this.saldo.toLocaleString('es-CO')}. (Máximo retirable actual: $${maximoRetirable.toLocaleString('es-CO')}).`
            };
        }
    }
}

/**
 * Cuenta Corriente (HU-02 y Diagrama UML)
 * - Sobregiro permitido: 20% (0.20)
 * - Permite retirar hasta saldo + 20% extra
 */
class CuentaCorriente extends Cuenta {
    constructor(numero, saldoInicial = 0) {
        super(numero, saldoInicial);
        this.sobregiroPermitido = 0.20; // 20% según HU-02 y UML
    }

    obtenerLimiteRetiro() {
        if (this.saldo > 0) {
            return this.saldo * (1 + this.sobregiroPermitido);
        }
        return 0; // Si ya está en saldo negativo, no puede sobregirar más
    }

    retirar(monto) {
        const valor = Number(monto);
        if (isNaN(valor) || valor <= 0) {
            return { exito: false, mensaje: "Ingresa un monto de retiro válido mayor a 0." };
        }

        if (this.saldo > 0) {
            const limite = this.saldo * (1 + this.sobregiroPermitido);

            if (valor <= this.saldo) {
                this.saldo -= valor;
                this.registrarMovimiento("Retiro Cuenta Corriente", valor);
                return {
                    exito: true,
                    sobregiro: false,
                    mensaje: `Retiro exitoso por $${valor.toLocaleString('es-CO')}.`
                };
            } else if (valor <= limite) {
                const sobregiroUtilizado = valor - this.saldo;
                this.saldo -= valor; // Queda con saldo negativo (en sobregiro)
                this.registrarMovimiento(`Retiro Corriente con Sobregiro (Uso sobregiro: $${Math.round(sobregiroUtilizado).toLocaleString('es-CO')})`, valor);
                return {
                    exito: true,
                    sobregiro: true,
                    sobregiroMonto: sobregiroUtilizado,
                    mensaje: `Retiro exitoso utilizando sobregiro por $${Math.round(sobregiroUtilizado).toLocaleString('es-CO')}. Tu nuevo saldo es -$${Math.abs(Math.round(this.saldo)).toLocaleString('es-CO')}.`
                };
            } else {
                return {
                    exito: false,
                    mensaje: `Transacción rechazada: El monto ($${valor.toLocaleString('es-CO')}) excede tu saldo disponible ($${this.saldo.toLocaleString('es-CO')}) más el 20% de sobregiro permitido. Máximo disponible a retirar: $${Math.round(limite).toLocaleString('es-CO')}.`
                };
            }
        } else {
            return {
                exito: false,
                mensaje: `Transacción rechazada: Tu cuenta ya se encuentra en sobregiro con saldo negativo (-$${Math.abs(Math.round(this.saldo)).toLocaleString('es-CO')}). Debes consignar fondos para normalizar tu cuenta.`
            };
        }
    }

    consignar(monto) {
        const valor = Number(monto);
        if (valor > 0) {
            const saldoPrevio = this.saldo;
            this.saldo += valor;
            if (saldoPrevio < 0) {
                this.registrarMovimiento(`Consignación Corriente (Amortiza sobregiro previo)`, valor);
            } else {
                this.registrarMovimiento("Consignación Cuenta Corriente", valor);
            }
            return true;
        }
        return false;
    }
}

/**
 * Tarjeta de Crédito (HU-04 y Diagrama UML)
 * - cupoCredito: Cupo total asignado
 * - deudaTotal: Capital pendiente por pagar
 * - Sistema de amortización francés bancario con cuotas fijas
 * - Tasas: 1-2 cuotas: 0% | 3-6 cuotas: 1.9% mes | 7-36 cuotas: 2.3% mes
 */
class TarjetaCredito {
    constructor(cupo = 2000000) {
        this.cupoCredito = Number(cupo) || 2000000;
        this.deudaTotal = 0;
        this.compras = [];
    }

    // Getters y Setters para compatibilidad total con el código anterior
    get cupo() { return this.cupoCredito; }
    set cupo(v) { this.cupoCredito = Number(v); }
    get deuda() { return this.deudaTotal; }
    set deuda(v) { this.deudaTotal = Number(v); }
    get cupoDisponible() { return this.consultarCupoDisponible(); }

    consultarCupoDisponible() {
        return Math.max(0, this.cupoCredito - this.deudaTotal);
    }

    /**
     * Calcula la cuota mensual usando el Sistema de Amortización Francés Bancario
     * C = (P * i) / (1 - (1 + i)^-n)
     */
    calcularCuota(monto, cuotas) {
        const principal = Number(monto);
        const n = parseInt(cuotas);
        let tasa = 0;

        if (n >= 3 && n <= 6) {
            tasa = 0.019; // 1.9% mensual según HU-04
        } else if (n >= 7) {
            tasa = 0.023; // 2.3% mensual según HU-04
        }

        let valorCuota = 0;
        let totalConInteres = 0;
        let totalIntereses = 0;

        if (tasa === 0) {
            valorCuota = principal / n;
            totalConInteres = principal;
            totalIntereses = 0;
        } else {
            valorCuota = (principal * tasa) / (1 - Math.pow(1 + tasa, -n));
            totalConInteres = valorCuota * n;
            totalIntereses = totalConInteres - principal;
        }

        return {
            monto: principal,
            cuotas: n,
            tasa: tasa,
            tasaPorcentaje: (tasa * 100).toFixed(1) + "%",
            valorCuota: parseFloat(valorCuota.toFixed(2)),
            totalConInteres: parseFloat(totalConInteres.toFixed(2)),
            totalIntereses: parseFloat(totalIntereses.toFixed(2))
        };
    }

    /**
     * Genera la tabla de amortización detallada mes a mes
     */
    generarTablaAmortizacion(monto, cuotas, tasa, valorCuota) {
        const tabla = [];
        let saldoRestante = Number(monto);

        for (let i = 1; i <= cuotas; i++) {
            let abonoInteres = tasa === 0 ? 0 : saldoRestante * tasa;
            let abonoCapital = tasa === 0 ? (monto / cuotas) : (valorCuota - abonoInteres);

            // Ajuste fino en la última cuota para cuadre perfecto a 0
            if (i === cuotas) {
                abonoCapital = saldoRestante;
                valorCuota = abonoCapital + abonoInteres;
            }

            let nuevoSaldo = Math.max(0, saldoRestante - abonoCapital);

            tabla.push({
                numeroCuota: i,
                saldoInicial: parseFloat(saldoRestante.toFixed(2)),
                cuotaTotal: parseFloat(valorCuota.toFixed(2)),
                abonoCapital: parseFloat(abonoCapital.toFixed(2)),
                abonoInteres: parseFloat(abonoInteres.toFixed(2)),
                saldoFinal: parseFloat(nuevoSaldo.toFixed(2)),
                pagada: false,
                fechaPago: null
            });

            saldoRestante = nuevoSaldo;
        }

        return tabla;
    }

    /**
     * Procesa una compra diferida con tarjeta de crédito
     */
    comprar(monto, cuotas, descripcion = "Compra en Comercio") {
        const valor = Number(monto);
        const n = parseInt(cuotas);

        if (isNaN(valor) || valor <= 0) {
            return { exito: false, mensaje: "Ingresa un valor de compra válido mayor a 0." };
        }
        if (isNaN(n) || n < 1 || n > 36) {
            return { exito: false, mensaje: "El plazo en cuotas debe ser entre 1 y 36." };
        }

        const cupoDisp = this.consultarCupoDisponible();
        if (valor > cupoDisp) {
            return {
                exito: false,
                mensaje: `Compra rechazada por cupo insuficiente. Cupo disponible: $${Math.round(cupoDisp).toLocaleString('es-CO')}.`
            };
        }

        const calculo = this.calcularCuota(valor, n);
        const tabla = this.generarTablaAmortizacion(valor, n, calculo.tasa, calculo.valorCuota);

        const nuevaCompra = {
            id: "TC-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
            fecha: new Date().toLocaleString(),
            descripcion: descripcion.trim() || "Compra con Tarjeta",
            monto: valor,
            cuotas: n,
            cuotasPagadas: 0,
            cuotasRestantes: n,
            tasa: calculo.tasa,
            valorCuota: calculo.valorCuota,
            totalConInteres: calculo.totalConInteres,
            totalIntereses: calculo.totalIntereses,
            saldoPendienteCapital: valor,
            tablaAmortizacion: tabla,
            estado: "Activa"
        };

        this.deudaTotal += valor;
        if (!this.compras) this.compras = [];
        this.compras.push(nuevaCompra);

        return {
            exito: true,
            compra: nuevaCompra,
            calculo: calculo,
            mensaje: `¡Compra aprobada por $${valor.toLocaleString('es-CO')} a ${n} ${n === 1 ? 'cuota' : 'cuotas'}!`
        };
    }

    /**
     * Paga la siguiente cuota pendiente de una compra específica con cargo a una cuenta bancaria
     */
    pagarCuotaCompra(compraId, cuentaOrigen) {
        if (!cuentaOrigen) return { exito: false, mensaje: "Cuenta de origen no seleccionada." };
        const compra = this.compras.find(c => c.id === compraId);
        if (!compra) return { exito: false, mensaje: "Compra no encontrada en el sistema." };
        if (compra.estado === "Pagada") return { exito: false, mensaje: "Esta compra ya se encuentra cancelada." };

        const proximaCuota = compra.tablaAmortizacion.find(c => !c.pagada);
        if (!proximaCuota) {
            compra.estado = "Pagada";
            return { exito: false, mensaje: "No hay cuotas pendientes para esta compra." };
        }

        const valorPagar = proximaCuota.cuotaTotal;
        if (cuentaOrigen.saldo < valorPagar) {
            return {
                exito: false,
                mensaje: `Saldo insuficiente en tu cuenta para pagar la cuota de $${Math.round(valorPagar).toLocaleString('es-CO')}. Saldo disponible: $${Math.round(cuentaOrigen.saldo).toLocaleString('es-CO')}.`
            };
        }

        // Débito de la cuenta bancaria seleccionada
        cuentaOrigen.saldo -= valorPagar;
        cuentaOrigen.registrarMovimiento(`Pago Cuota ${proximaCuota.numeroCuota}/${compra.cuotas} Tarjeta (${compra.descripcion})`, valorPagar);

        // Actualizar cuota
        proximaCuota.pagada = true;
        proximaCuota.fechaPago = new Date().toLocaleString();
        compra.cuotasPagadas++;
        compra.cuotasRestantes--;
        compra.saldoPendienteCapital = Math.max(0, compra.saldoPendienteCapital - proximaCuota.abonoCapital);

        // Reducir la deuda en la tarjeta (libera cupo disponible)
        this.deudaTotal = Math.max(0, this.deudaTotal - proximaCuota.abonoCapital);

        if (compra.cuotasRestantes === 0 || compra.saldoPendienteCapital <= 0) {
            compra.estado = "Pagada";
        }

        return {
            exito: true,
            mensaje: `¡Cuota ${proximaCuota.numeroCuota} de ${compra.cuotas} pagada exitosamente! Se debitaron $${Math.round(valorPagar).toLocaleString('es-CO')} de tu cuenta. Capital abonado: $${Math.round(proximaCuota.abonoCapital).toLocaleString('es-CO')}. Tu cupo disponible ha sido restablecido.`,
            compra: compra
        };
    }

    /**
     * Pago total anticipado de una compra (cancela capital y exonera intereses futuros)
     */
    pagarTotalidadCompra(compraId, cuentaOrigen) {
        if (!cuentaOrigen) return { exito: false, mensaje: "Cuenta de origen no seleccionada." };
        const compra = this.compras.find(c => c.id === compraId);
        if (!compra) return { exito: false, mensaje: "Compra no encontrada." };
        if (compra.estado === "Pagada") return { exito: false, mensaje: "Esta compra ya está totalmente pagada." };

        const capitalPendiente = compra.saldoPendienteCapital;
        if (cuentaOrigen.saldo < capitalPendiente) {
            return {
                exito: false,
                mensaje: `Saldo insuficiente en la cuenta para saldar la deuda de capital ($${Math.round(capitalPendiente).toLocaleString('es-CO')}). Saldo actual: $${Math.round(cuentaOrigen.saldo).toLocaleString('es-CO')}.`
            };
        }

        cuentaOrigen.saldo -= capitalPendiente;
        cuentaOrigen.registrarMovimiento(`Pago Anticipado Total Compra Tarjeta (${compra.descripcion})`, capitalPendiente);

        this.deudaTotal = Math.max(0, this.deudaTotal - capitalPendiente);
        compra.saldoPendienteCapital = 0;
        compra.cuotasRestantes = 0;
        compra.cuotasPagadas = compra.cuotas;
        compra.estado = "Pagada";
        compra.tablaAmortizacion.forEach(c => {
            if (!c.pagada) {
                c.pagada = true;
                c.fechaPago = new Date().toLocaleString() + " (Pago anticipado)";
            }
        });

        return {
            exito: true,
            mensaje: `¡Compra cancelada en su totalidad con éxito! Se debitaron $${Math.round(capitalPendiente).toLocaleString('es-CO')} de capital. ¡Se condonaron los intereses bancarios de cuotas futuras!`
        };
    }

    /**
     * Abono libre general a la deuda de la tarjeta
     */
    abonarDeudaGeneral(monto, cuentaOrigen) {
        const valor = Number(monto);
        if (isNaN(valor) || valor <= 0) return { exito: false, mensaje: "Ingresa un monto válido para abonar." };
        if (this.deudaTotal <= 0) return { exito: false, mensaje: "Tu tarjeta de crédito no registra deuda actual." };

        const valorAbonar = Math.min(valor, this.deudaTotal);
        if (cuentaOrigen.saldo < valorAbonar) {
            return {
                exito: false,
                mensaje: `Saldo insuficiente en la cuenta para realizar el abono de $${Math.round(valorAbonar).toLocaleString('es-CO')}. Saldo disponible: $${Math.round(cuentaOrigen.saldo).toLocaleString('es-CO')}.`
            };
        }

        cuentaOrigen.saldo -= valorAbonar;
        cuentaOrigen.registrarMovimiento(`Abono a Deuda Tarjeta de Crédito`, valorAbonar);
        this.deudaTotal = Math.max(0, this.deudaTotal - valorAbonar);

        // Disminuir proporcionalmente el saldo en compras activas
        let restante = valorAbonar;
        for (let compra of this.compras) {
            if (compra.estado !== "Pagada" && restante > 0) {
                let abonoACompra = Math.min(restante, compra.saldoPendienteCapital);
                compra.saldoPendienteCapital -= abonoACompra;
                restante -= abonoACompra;
                if (compra.saldoPendienteCapital <= 0) {
                    compra.estado = "Pagada";
                    compra.cuotasRestantes = 0;
                    compra.cuotasPagadas = compra.cuotas;
                }
            }
        }

        return {
            exito: true,
            mensaje: `¡Abono realizado con éxito por $${Math.round(valorAbonar).toLocaleString('es-CO')}! Deuda restante: $${Math.round(this.deudaTotal).toLocaleString('es-CO')}. Cupo restablecido.`
        };
    }
}

/**
 * Clase Cliente (Encapsulamiento y POO bancaria)
 * Cumple con el Diagrama UML de Banco Mi Plata
 */
class Cliente {
    constructor(cedula, nombre, celular, usuario, clave) {
        this.id = String(cedula);
        this.cedula = String(cedula);
        this.nombre = nombre;
        this.celular = celular;
        this.usuario = usuario;
        this.clave = clave;
        this.bloqueado = false;

        // Se le crean sus 3 productos financieros por defecto (POO)
        this.ahorros = new CuentaAhorros("AH-" + cedula, 0);
        this.corriente = new CuentaCorriente("CC-" + cedula, 0);
        this.tarjeta = new TarjetaCredito(2000000); // 2 millones de cupo base

        // Array de cuentas según Diagrama UML: Array<Cuenta>
        this.cuentas = [this.ahorros, this.corriente, this.tarjeta];
    }

    registrar() {
        return true;
    }

    autenticar(claveIngresada) {
        return this.clave === claveIngresada;
    }

    actualizarDatos(nuevoNombre, nuevoCelular) {
        if (nuevoNombre) this.nombre = nuevoNombre;
        if (nuevoCelular) this.celular = nuevoCelular;
    }
}

// ==========================================
// 3. PERSISTENCIA EN LOCALSTORAGE (BASE DE DATOS LOCAL)
// ==========================================

let baseDatosClientes = [];
let clienteActual = null;
let intentosLogin = 0;

// Cargar y reconstruir las instancias de clases POO desde localStorage
function cargarDatosDesdeStorage() {
    baseDatosClientes = [];
    const datosRaw = localStorage.getItem("bancoMiPlataPOO");
    if (!datosRaw) return;

    try {
        const datosGuardados = JSON.parse(datosRaw);
        datosGuardados.forEach(dato => {
            const cliente = new Cliente(dato.cedula || dato.id, dato.nombre, dato.celular, dato.usuario, dato.clave);
            cliente.bloqueado = Boolean(dato.bloqueado);

            // Reconstruir Cuenta Ahorros
            if (dato.ahorros) {
                cliente.ahorros.saldo = Number(dato.ahorros.saldo) || 0;
                cliente.ahorros.movimientos = Array.isArray(dato.ahorros.movimientos) ? dato.ahorros.movimientos : [];
            }

            // Reconstruir Cuenta Corriente
            if (dato.corriente) {
                cliente.corriente.saldo = Number(dato.corriente.saldo) || 0;
                cliente.corriente.movimientos = Array.isArray(dato.corriente.movimientos) ? dato.corriente.movimientos : [];
            }

            // Reconstruir Tarjeta de Crédito
            if (dato.tarjeta) {
                cliente.tarjeta.cupoCredito = Number(dato.tarjeta.cupoCredito || dato.tarjeta.cupo) || 2000000;
                cliente.tarjeta.deudaTotal = Number(dato.tarjeta.deudaTotal !== undefined ? dato.tarjeta.deudaTotal : dato.tarjeta.deuda) || 0;
                
                const comprasGuardadas = Array.isArray(dato.tarjeta.compras) ? dato.tarjeta.compras : [];
                cliente.tarjeta.compras = comprasGuardadas.map(c => {
                    const monto = Number(c.monto) || 0;
                    const cuotas = parseInt(c.cuotas) || 1;
                    const tasa = c.tasa !== undefined ? c.tasa : (cuotas >= 3 && cuotas <= 6 ? 0.019 : (cuotas >= 7 ? 0.023 : 0));
                    const calculo = cliente.tarjeta.calcularCuota(monto, cuotas);
                    
                    // Si no tiene tabla de amortización guardada, se la generamos automáticamente
                    const tabla = (Array.isArray(c.tablaAmortizacion) && c.tablaAmortizacion.length > 0)
                        ? c.tablaAmortizacion
                        : cliente.tarjeta.generarTablaAmortizacion(monto, cuotas, tasa, c.valorCuota || calculo.valorCuota);

                    return {
                        id: c.id || ("TC-" + Date.now() + "-" + Math.floor(Math.random() * 1000)),
                        fecha: c.fecha || new Date().toLocaleString(),
                        descripcion: c.descripcion || "Compra con Tarjeta",
                        monto: monto,
                        cuotas: cuotas,
                        cuotasPagadas: c.cuotasPagadas !== undefined ? c.cuotasPagadas : 0,
                        cuotasRestantes: c.cuotasRestantes !== undefined ? c.cuotasRestantes : cuotas,
                        tasa: tasa,
                        valorCuota: c.valorCuota || calculo.valorCuota,
                        totalConInteres: c.totalConInteres || calculo.totalConInteres,
                        totalIntereses: c.totalIntereses || calculo.totalIntereses,
                        saldoPendienteCapital: c.saldoPendienteCapital !== undefined ? c.saldoPendienteCapital : monto,
                        tablaAmortizacion: tabla,
                        estado: c.estado || "Activa"
                    };
                });
            }

            baseDatosClientes.push(cliente);
        });
    } catch (e) {
        console.error("Error al cargar datos de localStorage:", e);
    }
}

cargarDatosDesdeStorage();

function guardarDatos() {
    localStorage.setItem("bancoMiPlataPOO", JSON.stringify(baseDatosClientes));
}

// ==========================================
// 4. INTERFAZ Y FLUJO DE USUARIO (HTML DOM)
// ==========================================

function mostrarSeccion(idSeccion) {
    const secciones = ['inicio', 'login', 'registro', 'panelCajero'];
    secciones.forEach(secId => {
        const el = document.getElementById(secId);
        if (el) el.className = 'seccion-oculta';
    });

    const target = document.getElementById(idSeccion);
    if (!target) return;

    if (idSeccion === 'inicio') {
        target.className = 'seccion-activa hero';
    } else if (idSeccion === 'panelCajero') {
        target.className = 'seccion-activa';
        actualizarPanel();
    } else {
        target.className = 'seccion-activa formulario-section';
    }
}

// Procesar Registro de Cliente (HU-01)
function procesarRegistro() {
    const cedula = document.getElementById('regCedula').value.trim();
    const nombre = document.getElementById('regNombre').value.trim();
    const celular = document.getElementById('regCelular').value.trim();
    const usuario = document.getElementById('regUsuario').value.trim();
    const clave = document.getElementById('regClave').value;
    const clave2 = document.getElementById('regClave2').value;
    const msgElement = document.getElementById('msgRegistro');

    if (!cedula || !nombre || !celular || !usuario || !clave) {
        msgElement.innerText = "Todos los campos son estrictamente obligatorios.";
        return;
    }

    if (clave !== clave2) {
        msgElement.innerText = "Las contraseñas no coinciden. Por favor verifica.";
        return;
    }

    if (clave.length < 4) {
        msgElement.innerText = "La contraseña debe tener mínimo 4 caracteres por seguridad.";
        return;
    }

    // Validación de usuario y cédula únicos
    if (baseDatosClientes.some(c => c.usuario.toLowerCase() === usuario.toLowerCase())) {
        msgElement.innerText = "El nombre de usuario ya está registrado en el banco.";
        return;
    }

    if (baseDatosClientes.some(c => c.cedula === cedula)) {
        msgElement.innerText = "Ya existe un cliente registrado con este número de cédula.";
        return;
    }

    // Instanciar nuevo cliente mediante POO
    const nuevoCliente = new Cliente(cedula, nombre, celular, usuario, clave);
    baseDatosClientes.push(nuevoCliente);
    guardarDatos();

    alert(`¡Bienvenido a Mi Plata, ${nombre}! Tu Cuenta de Ahorros, Cuenta Corriente y Tarjeta de Crédito han sido creadas con éxito.`);
    document.getElementById('formRegistro').reset();
    msgElement.innerText = "";
    mostrarSeccion('login');
}

// Procesar Inicio de Sesión
function procesarLogin() {
    const usuario = document.getElementById('loginUsuario').value.trim();
    const clave = document.getElementById('loginClave').value;
    const msgElement = document.getElementById('msgLogin');

    const clienteEncontrado = baseDatosClientes.find(c => c.usuario.toLowerCase() === usuario.toLowerCase());

    if (!clienteEncontrado) {
        msgElement.innerText = "El usuario ingresado no existe en nuestro sistema.";
        return;
    }

    if (clienteEncontrado.bloqueado) {
        msgElement.innerText = "Cuenta bloqueada por seguridad al superar los 3 intentos. Comunícate con la entidad bancaria.";
        return;
    }

    if (clienteEncontrado.autenticar(clave)) {
        clienteActual = clienteEncontrado;
        intentosLogin = 0;
        document.getElementById('formLogin').reset();
        msgElement.innerText = "";

        mostrarSeccion('panelCajero');
    } else {
        intentosLogin++;
        if (intentosLogin >= 3) {
            clienteEncontrado.bloqueado = true;
            guardarDatos();
            msgElement.innerText = "Cuenta bloqueada por seguridad tras superar 3 intentos fallidos.";
        } else {
            msgElement.innerText = `Contraseña incorrecta. Intentos restantes: ${3 - intentosLogin}`;
        }
    }
}

function cerrarSesion() {
    clienteActual = null;
    mostrarSeccion('inicio');
}

// ==========================================
// 5. PANEL DE CONTROL Y MÉTRICAS (DASHBOARD)
// ==========================================

function actualizarPanel() {
    if (!clienteActual) return;

    const saludoEl = document.getElementById('saludoUsuario');
    const ahorroEl = document.getElementById('saldoAhorro');
    const corrienteEl = document.getElementById('saldoCorriente');
    const tarjetaEl = document.getElementById('deudaTarjeta');
    const cupoEl = document.getElementById('cupoTarjeta');
    const progressEl = document.getElementById('progresoCupoBar');

    if (saludoEl) saludoEl.innerText = `Bienvenido, ${clienteActual.nombre}`;

    // 1. Saldo Ahorros
    const saldoAhorros = clienteActual.ahorros.consultarSaldo();
    if (ahorroEl) {
        ahorroEl.innerText = "$ " + Number(saldoAhorros).toLocaleString('es-CO');
    }

    // 2. Saldo Corriente (manejo visual de sobregiro)
    const saldoCorriente = clienteActual.corriente.consultarSaldo();
    if (corrienteEl) {
        if (saldoCorriente < 0) {
            corrienteEl.innerText = "-$ " + Number(Math.abs(saldoCorriente)).toLocaleString('es-CO');
            corrienteEl.style.color = "#93c5fd"; // Tono azul hielo distintivo
        } else {
            corrienteEl.innerText = "$ " + Number(saldoCorriente).toLocaleString('es-CO');
            corrienteEl.style.color = "";
        }
    }

    // 3. Tarjeta de Crédito
    const deuda = clienteActual.tarjeta.deudaTotal;
    const cupoTotal = clienteActual.tarjeta.cupoCredito;
    const cupoDisp = clienteActual.tarjeta.consultarCupoDisponible();

    if (tarjetaEl) {
        tarjetaEl.innerText = "$ " + Number(deuda).toLocaleString('es-CO');
    }

    if (cupoEl) {
        cupoEl.innerText = "Cupo Disponible: $" + Number(cupoDisp).toLocaleString('es-CO');
        cupoEl.title = `Cupo Total: $${Number(cupoTotal).toLocaleString('es-CO')} | Deuda a Capital: $${Number(deuda).toLocaleString('es-CO')}`;
    }

    if (progressEl) {
        const pct = cupoTotal > 0 ? Math.min(100, Math.round((deuda / cupoTotal) * 100)) : 0;
        progressEl.style.width = pct + "%";
        const progressLabel = document.getElementById('progresoCupoLabel');
        if (progressLabel) progressLabel.innerText = `${pct}% utilizado`;
    }
}

// ==========================================
// 6. MODAL DE OPERACIONES BANCARIAS
// ==========================================

let transaccionActual = null;

function abrirModal(tipo, extraParam = null) {
    if (!clienteActual) {
        alert("Debes iniciar sesión para realizar operaciones bancarias.");
        mostrarSeccion('login');
        return;
    }

    transaccionActual = tipo;
    const modal = document.getElementById('modalTransaccion');
    const modalTitulo = document.getElementById('modalTitulo');
    const modalBadge = document.getElementById('modalBadge');
    const btnConfirmar = document.getElementById('btnModalConfirmar');
    const msgModal = document.getElementById('msgModal');

    // Campos del formulario
    const campos = [
        'campoTipoCuenta', 'campoTipoTransferencia', 'campoCuentaDestinoPropia',
        'campoCedulaDestino', 'campoDescripcionCompra', 'campoNuevoNombre',
        'campoNuevoCelular', 'campoClaveActual', 'campoClaveNueva',
        'campoClaveConfirmar', 'campoMonto', 'campoCuotas', 'simuladorCuotasPreview',
        'campoPagarTarjetaOpciones', 'contenedorHistorial'
    ];
    campos.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('seccion-oculta');
    });

    const form = document.getElementById('formModalTransaccion');
    if (form) form.reset();
    if (msgModal) msgModal.innerText = "";
    if (btnConfirmar) btnConfirmar.style.display = 'block';

    const labelTipoCuenta = document.getElementById('labelTipoCuenta');
    const campoTipoCuenta = document.getElementById('campoTipoCuenta');
    const campoMonto = document.getElementById('campoMonto');

    if (tipo === 'consignar') {
        modalBadge.innerText = "DEPÓSITO BANCARIO";
        modalTitulo.innerText = "Consignar Fondos";
        labelTipoCuenta.innerText = "Cuenta de Destino";
        campoTipoCuenta.classList.remove('seccion-oculta');
        campoMonto.classList.remove('seccion-oculta');
        btnConfirmar.innerText = "Confirmar Consignación";
    } 
    else if (tipo === 'retirar') {
        modalBadge.innerText = "DISPOSICIÓN DE FONDOS";
        modalTitulo.innerText = "Retirar Dinero";
        labelTipoCuenta.innerText = "Cuenta de Origen";
        campoTipoCuenta.classList.remove('seccion-oculta');
        campoMonto.classList.remove('seccion-oculta');
        btnConfirmar.innerText = "Confirmar Retiro";
    } 
    else if (tipo === 'comprar') {
        const cupoDisponible = clienteActual.tarjeta.consultarCupoDisponible();
        modalBadge.innerText = `TARJETA DE CRÉDITO • CUPO DISPONIBLE: $${Number(cupoDisponible).toLocaleString('es-CO')}`;
        modalTitulo.innerText = "Comprar con Tarjeta";
        
        const campoDesc = document.getElementById('campoDescripcionCompra');
        const campoCuotas = document.getElementById('campoCuotas');
        const preview = document.getElementById('simuladorCuotasPreview');

        if (campoDesc) campoDesc.classList.remove('seccion-oculta');
        campoMonto.classList.remove('seccion-oculta');
        if (campoCuotas) campoCuotas.classList.remove('seccion-oculta');
        if (preview) preview.classList.remove('seccion-oculta');

        btnConfirmar.innerText = "Autorizar Compra";
        actualizarSimuladorCompra();
    } 
    else if (tipo === 'transferir') {
        modalBadge.innerText = "TRANSFERENCIA EN LÍNEA";
        modalTitulo.innerText = "Transferir Fondos";
        labelTipoCuenta.innerText = "Cuenta de Origen";
        campoTipoCuenta.classList.remove('seccion-oculta');
        document.getElementById('campoTipoTransferencia').classList.remove('seccion-oculta');
        document.getElementById('campoCuentaDestinoPropia').classList.remove('seccion-oculta');
        campoMonto.classList.remove('seccion-oculta');
        btnConfirmar.innerText = "Confirmar Transferencia";

        // Asegurar que origen y destino sean distintos inicialmente
        const selOrigen = document.getElementById('modalTipoCuenta');
        const selDestino = document.getElementById('modalCuentaDestino');
        if (selOrigen) selOrigen.value = 'ahorros';
        if (selDestino) selDestino.value = 'corriente';
    } 
    else if (tipo === 'pagarTarjeta') {
        modalBadge.innerText = "GESTIÓN DE PAGOS";
        modalTitulo.innerText = "Pagar Tarjeta de Crédito";
        
        poblarOpcionesPagoTarjeta();
        document.getElementById('campoPagarTarjetaOpciones').classList.remove('seccion-oculta');
        labelTipoCuenta.innerText = "Debitar de mi cuenta";
        campoTipoCuenta.classList.remove('seccion-oculta');
        btnConfirmar.innerText = "Efectuar Pago";
    } 
    else if (tipo === 'historial') {
        modalBadge.innerText = "EXTRACTO FINANCIERO";
        modalTitulo.innerText = "Movimientos y Transacciones";
        document.getElementById('contenedorHistorial').classList.remove('seccion-oculta');
        btnConfirmar.style.display = 'none';
        cambiarTabHistorial('cuentas');
    } 
    else if (tipo === 'detalleTarjeta') {
        modalBadge.innerText = "ESTADO DE CUENTA TARJETA";
        modalTitulo.innerText = "Compras Diferidas y Cuotas por Pagar";
        document.getElementById('contenedorHistorial').classList.remove('seccion-oculta');
        btnConfirmar.style.display = 'none';
        cambiarTabHistorial('tarjeta');
    } 
    else if (tipo === 'verAmortizacion') {
        modalBadge.innerText = "TABLA FINANCIERA";
        modalTitulo.innerText = "Tabla de Amortización Francesa";
        document.getElementById('contenedorHistorial').classList.remove('seccion-oculta');
        btnConfirmar.style.display = 'none';
        cambiarTabHistorial('amortizacion', extraParam);
    } 
    else if (tipo === 'editarPerfil') {
        modalBadge.innerText = "DATOS DE CLIENTE";
        modalTitulo.innerText = "Editar Perfil";
        const cNom = document.getElementById('campoNuevoNombre');
        const cCel = document.getElementById('campoNuevoCelular');
        if (cNom) {
            cNom.classList.remove('seccion-oculta');
            document.getElementById('modalNuevoNombre').value = clienteActual.nombre;
        }
        if (cCel) {
            cCel.classList.remove('seccion-oculta');
            document.getElementById('modalNuevoCelular').value = clienteActual.celular;
        }
        btnConfirmar.innerText = "Guardar Cambios";
    } 
    else if (tipo === 'cambiarClave') {
        modalBadge.innerText = "SEGURIDAD BANCARIA";
        modalTitulo.innerText = "Cambiar Contraseña";
        document.getElementById('campoClaveActual').classList.remove('seccion-oculta');
        document.getElementById('campoClaveNueva').classList.remove('seccion-oculta');
        document.getElementById('campoClaveConfirmar').classList.remove('seccion-oculta');
        btnConfirmar.innerText = "Actualizar Contraseña";
    }

    if (modal) modal.classList.remove('seccion-oculta');
}

function cerrarModal() {
    const modal = document.getElementById('modalTransaccion');
    if (modal) modal.classList.add('seccion-oculta');
    const msgModal = document.getElementById('msgModal');
    if (msgModal) msgModal.innerText = "";
    transaccionActual = null;
}

// Simulador interactivo en tiempo real al comprar con tarjeta
function actualizarSimuladorCompra() {
    const montoEl = document.getElementById('modalMonto');
    const cuotasEl = document.getElementById('modalCuotas');
    const previewEl = document.getElementById('simuladorCuotasPreview');
    if (!montoEl || !cuotasEl || !previewEl || !clienteActual) return;

    const monto = parseFloat(montoEl.value) || 0;
    const cuotas = parseInt(cuotasEl.value) || 1;

    if (monto <= 0) {
        previewEl.innerHTML = `
            <div class="simulador-card">
                <span class="simulador-card__badge">Simulador Financiero</span>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 6px;">
                    Digita el monto y plazo para calcular tu cuota mensual con las tasas oficiales del banco.
                </p>
            </div>
        `;
        return;
    }

    const calculo = clienteActual.tarjeta.calcularCuota(monto, cuotas);
    const cupoDisponible = clienteActual.tarjeta.consultarCupoDisponible();
    const cupoExcedido = monto > cupoDisponible;

    previewEl.innerHTML = `
        <div class="simulador-card ${cupoExcedido ? 'simulador-card--alerta' : ''}">
            <div class="simulador-card__header">
                <span class="simulador-card__badge">Simulación Oficial de Cuotas</span>
                <span style="font-size: 0.78rem; font-weight: 700; color: #38bdf8;">
                    Tasa: ${calculo.tasaPorcentaje} ${calculo.tasa === 0 ? '(0% interés)' : 'M.V.'}
                </span>
            </div>
            <div class="simulador-grid">
                <div class="simulador-item">
                    <span class="simulador-label">Cuota Mensual</span>
                    <span class="simulador-val" style="color: #38bdf8; font-weight: 800;">
                        $ ${Number(Math.round(calculo.valorCuota)).toLocaleString('es-CO')}
                    </span>
                </div>
                <div class="simulador-item">
                    <span class="simulador-label">Total a Pagar</span>
                    <span class="simulador-val">
                        $ ${Number(Math.round(calculo.totalConInteres)).toLocaleString('es-CO')}
                    </span>
                </div>
                <div class="simulador-item">
                    <span class="simulador-label">Intereses Totales</span>
                    <span class="simulador-val">
                        $ ${Number(Math.round(calculo.totalIntereses)).toLocaleString('es-CO')}
                    </span>
                </div>
                <div class="simulador-item">
                    <span class="simulador-label">Cupo Tras Compra</span>
                    <span class="simulador-val" style="color: ${cupoExcedido ? '#93c5fd' : '#e0f2fe'};">
                        ${cupoExcedido ? '¡Supera tu cupo!' : '$ ' + Number(Math.round(cupoDisponible - monto)).toLocaleString('es-CO')}
                    </span>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// 7. EJECUTOR PRINCIPAL DE TRANSACCIONES
// ==========================================

function ejecutarTransaccion() {
    if (!clienteActual || !transaccionActual) return;

    const msgModal = document.getElementById('msgModal');
    const tipoCuenta = document.getElementById('modalTipoCuenta') ? document.getElementById('modalTipoCuenta').value : 'ahorros';
    const montoEl = document.getElementById('modalMonto');
    const monto = montoEl ? parseFloat(montoEl.value) : 0;
    if (msgModal) msgModal.innerText = "";

    // 1. CONSIGNACIÓN
    if (transaccionActual === 'consignar') {
        if (isNaN(monto) || monto <= 0) {
            msgModal.innerText = "Por favor ingresa un monto válido mayor a 0.";
            return;
        }

        let exito = false;
        if (tipoCuenta === 'ahorros') {
            exito = clienteActual.ahorros.consignar(monto);
        } else {
            exito = clienteActual.corriente.consignar(monto);
        }

        if (exito) {
            guardarDatos();
            actualizarPanel();
            cerrarModal();
            alert(`¡Consignación exitosa! Se han acreditado $${monto.toLocaleString('es-CO')} a tu Cuenta de ${tipoCuenta === 'ahorros' ? 'Ahorros' : 'Corriente'}.`);
        } else {
            msgModal.innerText = "No fue posible procesar la consignación.";
        }
    }

    // 2. RETIRO
    else if (transaccionActual === 'retirar') {
        if (isNaN(monto) || monto <= 0) {
            msgModal.innerText = "Por favor ingresa un monto válido mayor a 0.";
            return;
        }

        let res;
        if (tipoCuenta === 'ahorros') {
            res = clienteActual.ahorros.retirar(monto);
        } else {
            res = clienteActual.corriente.retirar(monto);
        }

        if (!res.exito) {
            msgModal.innerText = res.mensaje;
            return;
        }

        guardarDatos();
        actualizarPanel();
        cerrarModal();
        alert(res.mensaje);
    }

    // 3. COMPRA CON TARJETA DE CRÉDITO
    else if (transaccionActual === 'comprar') {
        const cuotasEl = document.getElementById('modalCuotas');
        const descEl = document.getElementById('modalDescripcionCompra');
        const cuotas = cuotasEl ? parseInt(cuotasEl.value) : 1;
        const descripcion = descEl ? descEl.value.trim() : "Compra con Tarjeta";

        if (isNaN(monto) || monto <= 0) {
            msgModal.innerText = "Por favor ingresa un valor de compra mayor a 0.";
            return;
        }

        const res = clienteActual.tarjeta.comprar(monto, cuotas, descripcion);
        if (!res.exito) {
            msgModal.innerText = res.mensaje;
            return;
        }

        // Registrar movimiento de control en el historial del cliente
        clienteActual.ahorros.registrarMovimiento(`Compra Tarjeta Crédito: ${descripcion} (${cuotas} cuotas)`, monto);

        guardarDatos();
        actualizarPanel();
        cerrarModal();
        alert(`¡Compra exitosa! ${res.mensaje} Cuota mensual estimada: $${Number(Math.round(res.calculo.valorCuota)).toLocaleString('es-CO')}.`);
    }

    // 4. TRANSFERENCIA
    else if (transaccionActual === 'transferir') {
        const tipoDestino = document.getElementById('modalTipoDestino').value;
        const cuentaDestinoPropia = document.getElementById('modalCuentaDestino') ? document.getElementById('modalCuentaDestino').value : 'corriente';
        const cedulaDestinoEl = document.getElementById('modalCedulaDestino');
        const cedulaDestino = cedulaDestinoEl ? cedulaDestinoEl.value.trim() : '';

        if (isNaN(monto) || monto <= 0) {
            msgModal.innerText = "Por favor ingresa un monto válido para transferir.";
            return;
        }

        const res = ejecutarTransferencia(tipoCuenta, cuentaDestinoPropia, monto, tipoDestino, cedulaDestino);
        if (res.exito) {
            guardarDatos();
            actualizarPanel();
            cerrarModal();
            alert(res.mensaje);
        } else {
            msgModal.innerText = res.mensaje;
        }
    }

    // 5. PAGAR TARJETA DE CRÉDITO
    else if (transaccionActual === 'pagarTarjeta') {
        const opcionSelect = document.getElementById('selectOpcionPagoTarjeta');
        if (!opcionSelect) return;
        const modo = opcionSelect.value;
        const cuentaDebito = tipoCuenta === 'ahorros' ? clienteActual.ahorros : clienteActual.corriente;

        let res;
        if (modo.startsWith('cuota:')) {
            const compraId = modo.split(':')[1];
            res = clienteActual.tarjeta.pagarCuotaCompra(compraId, cuentaDebito);
        } else if (modo.startsWith('total:')) {
            const compraId = modo.split(':')[1];
            res = clienteActual.tarjeta.pagarTotalidadCompra(compraId, cuentaDebito);
        } else {
            // Abono libre
            const montoAbono = parseFloat(document.getElementById('inputMontoAbonoLibre').value);
            res = clienteActual.tarjeta.abonarDeudaGeneral(montoAbono, cuentaDebito);
        }

        if (res.exito) {
            guardarDatos();
            actualizarPanel();
            cerrarModal();
            alert(res.mensaje);
        } else {
            msgModal.innerText = res.mensaje;
        }
    }

    // 6. EDITAR PERFIL
    else if (transaccionActual === 'editarPerfil') {
        const nuevoNombre = document.getElementById('modalNuevoNombre').value.trim();
        const nuevoCelular = document.getElementById('modalNuevoCelular').value.trim();

        if (nuevoNombre.length < 3) {
            msgModal.innerText = "El nombre completo debe tener al menos 3 caracteres.";
            return;
        }
        if (nuevoCelular.length < 7) {
            msgModal.innerText = "Ingresa un número de celular válido.";
            return;
        }

        clienteActual.actualizarDatos(nuevoNombre, nuevoCelular);
        guardarDatos();
        actualizarPanel();
        cerrarModal();
        alert("¡Tus datos personales han sido actualizados con éxito!");
    }

    // 7. CAMBIAR CONTRASEÑA
    else if (transaccionActual === 'cambiarClave') {
        const actual = document.getElementById('modalClaveActual').value;
        const nueva = document.getElementById('modalClaveNueva').value;
        const confirmar = document.getElementById('modalClaveConfirmar').value;

        if (!clienteActual.autenticar(actual)) {
            msgModal.innerText = "La contraseña actual es incorrecta.";
            return;
        }
        if (nueva.length < 4) {
            msgModal.innerText = "La nueva contraseña debe tener mínimo 4 caracteres.";
            return;
        }
        if (nueva !== confirmar) {
            msgModal.innerText = "La confirmación de la contraseña no coincide.";
            return;
        }

        clienteActual.clave = nueva;
        guardarDatos();
        cerrarModal();
        alert("¡Tu contraseña ha sido actualizada con éxito!");
    }
}

// Alias para compatibilidad
const confirmarTransaccion = ejecutarTransaccion;

// ==========================================
// 8. TRANSFERENCIAS ENTRE CUENTAS (HU-05)
// ==========================================

function ejecutarTransferencia(cuentaOrigenTipo, cuentaDestinoTipo, monto, tipoDestino = 'propia', cedulaDestino = '') {
    if (!clienteActual) return { exito: false, mensaje: "No hay sesión activa." };
    if (isNaN(monto) || monto <= 0) return { exito: false, mensaje: "Monto inválido para transferir." };

    const cuentaOrigen = cuentaOrigenTipo === 'ahorros' ? clienteActual.ahorros : clienteActual.corriente;
    let cuentaDestino = null;
    let nombreDestinatario = "";

    // A. Transferencia entre productos propios
    if (tipoDestino === 'propia') {
        if (cuentaOrigenTipo === cuentaDestinoTipo) {
            return {
                exito: false,
                mensaje: `No puedes transferir de tu ${cuentaOrigenTipo === 'ahorros' ? 'Cuenta de Ahorros' : 'Cuenta Corriente'} a esa misma cuenta. Selecciona una cuenta de destino diferente.`
            };
        }
        cuentaDestino = cuentaDestinoTipo === 'ahorros' ? clienteActual.ahorros : clienteActual.corriente;
        nombreDestinatario = `mi ${cuentaDestinoTipo === 'ahorros' ? 'Cuenta de Ahorros' : 'Cuenta Corriente'}`;
    } 
    // B. Transferencia a otro usuario por cédula o usuario
    else {
        if (!cedulaDestino) {
            return { exito: false, mensaje: "Debes ingresar la cédula o usuario del destinatario." };
        }

        const clienteDestino = baseDatosClientes.find(c => c.cedula === cedulaDestino || c.usuario.toLowerCase() === cedulaDestino.toLowerCase());
        if (!clienteDestino) {
            return { exito: false, mensaje: "El usuario o cédula de destino no existe en el banco." };
        }

        if (clienteDestino.cedula === clienteActual.cedula && cuentaOrigenTipo === 'ahorros') {
            return { exito: false, mensaje: "Para transferir a tus propios productos, usa la opción 'Entre mis propias cuentas'." };
        }

        cuentaDestino = clienteDestino.ahorros;
        nombreDestinatario = `${clienteDestino.nombre} (Cédula: ${clienteDestino.cedula})`;
    }

    // Validar disponibilidad de fondos según tipo de cuenta
    if (cuentaOrigenTipo === 'ahorros') {
        if (cuentaOrigen.saldo < monto) {
            return {
                exito: false,
                mensaje: `Saldo insuficiente en tu Cuenta de Ahorros. Saldo disponible: $${cuentaOrigen.saldo.toLocaleString('es-CO')}.`
            };
        }
        cuentaOrigen.saldo -= monto;
    } else {
        // En corriente valida hasta el 20% de sobregiro
        const limite = cuentaOrigen.obtenerLimiteRetiro();
        if (monto > limite) {
            return {
                exito: false,
                mensaje: `Fondos insuficientes en Cuenta Corriente (supera el sobregiro permitido del 20%).`
            };
        }
        cuentaOrigen.saldo -= monto;
    }

    // Registrar movimientos en ambas cuentas mediante POO
    cuentaOrigen.registrarMovimiento(`Transferencia enviada a ${nombreDestinatario}`, monto);
    cuentaDestino.saldo += monto;
    cuentaDestino.registrarMovimiento(`Transferencia recibida de ${clienteActual.nombre}`, monto);

    return {
        exito: true,
        mensaje: `¡Transferencia exitosa! Se enviaron $${monto.toLocaleString('es-CO')} a ${nombreDestinatario}.`
    };
}

function cambiarTipoDestinoTransferencia() {
    const selectDestino = document.getElementById('modalTipoDestino');
    if (!selectDestino) return;
    const tipo = selectDestino.value;
    const campoPropia = document.getElementById('campoCuentaDestinoPropia');
    const campoCedula = document.getElementById('campoCedulaDestino');

    if (tipo === 'propia') {
        if (campoPropia) campoPropia.classList.remove('seccion-oculta');
        if (campoCedula) campoCedula.classList.add('seccion-oculta');
        ajustarCuentaDestino();
    } else {
        if (campoPropia) campoPropia.classList.add('seccion-oculta');
        if (campoCedula) campoCedula.classList.remove('seccion-oculta');
    }
}

function ajustarCuentaDestino() {
    if (transaccionActual !== 'transferir') return;
    const origenSelect = document.getElementById('modalTipoCuenta');
    const destinoSelect = document.getElementById('modalCuentaDestino');
    if (origenSelect && destinoSelect) {
        destinoSelect.value = origenSelect.value === 'ahorros' ? 'corriente' : 'ahorros';
    }
}

function validarCuentasTransferencia() {
    if (transaccionActual !== 'transferir') return;
    const tipoDestino = document.getElementById('modalTipoDestino') ? document.getElementById('modalTipoDestino').value : 'propia';
    if (tipoDestino !== 'propia') return;

    const origenSelect = document.getElementById('modalTipoCuenta');
    const destinoSelect = document.getElementById('modalCuentaDestino');
    if (origenSelect && destinoSelect && origenSelect.value === destinoSelect.value) {
        destinoSelect.value = origenSelect.value === 'ahorros' ? 'corriente' : 'ahorros';
    }
}

// ==========================================
// 9. GESTIÓN DE PAGOS DE TARJETA DE CRÉDITO
// ==========================================

function poblarOpcionesPagoTarjeta() {
    const contenedor = document.getElementById('campoPagarTarjetaOpciones');
    if (!contenedor || !clienteActual) return;

    const comprasActivas = clienteActual.tarjeta.compras.filter(c => c.estado !== "Pagada");
    const deuda = clienteActual.tarjeta.deudaTotal;

    let html = `
        <label for="selectOpcionPagoTarjeta">Selecciona qué deseas pagar</label>
        <select id="selectOpcionPagoTarjeta" onchange="actualizarDetallePagoTarjeta()">
    `;

    if (comprasActivas.length > 0) {
        html += `<optgroup label="Pagar Próxima Cuota Mensual">`;
        comprasActivas.forEach(c => {
            const proximaCuota = c.tablaAmortizacion.find(t => !t.pagada);
            const numCuota = proximaCuota ? proximaCuota.numeroCuota : c.cuotasPagadas + 1;
            const cuotaVal = proximaCuota ? proximaCuota.cuotaTotal : c.valorCuota;
            html += `<option value="cuota:${c.id}">Cuota ${numCuota}/${c.cuotas} de "${c.descripcion}" — $${Number(Math.round(cuotaVal)).toLocaleString('es-CO')}</option>`;
        });
        html += `</optgroup>`;

        html += `<optgroup label="Pagar Totalidad de Compra (Sin intereses futuros)">`;
        comprasActivas.forEach(c => {
            html += `<option value="total:${c.id}">Cancelar Total "${c.descripcion}" — $${Number(Math.round(c.saldoPendienteCapital)).toLocaleString('es-CO')}</option>`;
        });
        html += `</optgroup>`;
    }

    html += `
            <optgroup label="Abono Libre">
                <option value="abonoLibre">Abonar un monto libre a la deuda total</option>
            </optgroup>
        </select>
        <div id="contenedorInputAbonoLibre" class="modal-field seccion-oculta" style="margin-top: 14px;">
            <label for="inputMontoAbonoLibre">Monto a Abonar ($ COP)</label>
            <input type="number" id="inputMontoAbonoLibre" placeholder="Ej: 100000" min="1" step="any">
        </div>
        <div id="detallePagoInfo" class="simulador-card" style="margin-top: 14px;"></div>
    `;

    contenedor.innerHTML = html;
    actualizarDetallePagoTarjeta();
}

function actualizarDetallePagoTarjeta() {
    const select = document.getElementById('selectOpcionPagoTarjeta');
    const inputAbono = document.getElementById('contenedorInputAbonoLibre');
    const infoBox = document.getElementById('detallePagoInfo');
    if (!select || !infoBox || !clienteActual) return;

    const val = select.value;

    if (val === 'abonoLibre') {
        if (inputAbono) inputAbono.classList.remove('seccion-oculta');
        infoBox.innerHTML = `
            <span class="simulador-card__badge">Abono Extraordinario</span>
            <p style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 6px;">
                Deuda total a capital: <strong>$${Number(Math.round(clienteActual.tarjeta.deudaTotal)).toLocaleString('es-CO')}</strong>.<br>
                El dinero ingresado amortizará capital y liberará inmediatamente tu cupo disponible.
            </p>
        `;
    } else if (val.startsWith('cuota:')) {
        if (inputAbono) inputAbono.classList.add('seccion-oculta');
        const compraId = val.split(':')[1];
        const compra = clienteActual.tarjeta.compras.find(c => c.id === compraId);
        if (compra) {
            const proximaCuota = compra.tablaAmortizacion.find(t => !t.pagada) || {};
            infoBox.innerHTML = `
                <span class="simulador-card__badge">Pago de Cuota Mensual</span>
                <div class="simulador-grid" style="margin-top: 8px;">
                    <div class="simulador-item">
                        <span class="simulador-label">Cuota a Pagar</span>
                        <span class="simulador-val" style="color: #38bdf8;">$${Number(Math.round(proximaCuota.cuotaTotal || compra.valorCuota)).toLocaleString('es-CO')}</span>
                    </div>
                    <div class="simulador-item">
                        <span class="simulador-label">Abono Capital</span>
                        <span class="simulador-val">$${Number(Math.round(proximaCuota.abonoCapital || 0)).toLocaleString('es-CO')}</span>
                    </div>
                    <div class="simulador-item">
                        <span class="simulador-label">Interés del Mes</span>
                        <span class="simulador-val">$${Number(Math.round(proximaCuota.abonoInteres || 0)).toLocaleString('es-CO')}</span>
                    </div>
                    <div class="simulador-item">
                        <span class="simulador-label">Progreso</span>
                        <span class="simulador-val">${compra.cuotasPagadas} de ${compra.cuotas} pagadas</span>
                    </div>
                </div>
            `;
        }
    } else if (val.startsWith('total:')) {
        if (inputAbono) inputAbono.classList.add('seccion-oculta');
        const compraId = val.split(':')[1];
        const compra = clienteActual.tarjeta.compras.find(c => c.id === compraId);
        if (compra) {
            infoBox.innerHTML = `
                <span class="simulador-card__badge">Cancelación Total Anticipada</span>
                <p style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 6px;">
                    Pagas solo el capital adeudado: <strong style="color: #38bdf8;">$${Number(Math.round(compra.saldoPendienteCapital)).toLocaleString('es-CO')}</strong>.<br>
                    ¡Te ahorras todos los intereses correspondientes a las cuotas restantes!
                </p>
            `;
        }
    }
}

// ==========================================
// 10. HISTORIAL, CUOTAS Y AMORTIZACIÓN BANCARIA
// ==========================================

function cambiarTabHistorial(tab, extraParam = null) {
    const tabCuentas = document.getElementById('tabHistorialCuentas');
    const tabTarjeta = document.getElementById('tabHistorialTarjeta');
    const modalBadge = document.getElementById('modalBadge');
    const modalTitulo = document.getElementById('modalTitulo');

    if (tab === 'cuentas') {
        if (tabCuentas) tabCuentas.className = 'tab-btn tab-btn--activo';
        if (tabTarjeta) tabTarjeta.className = 'tab-btn';
        if (modalBadge) modalBadge.innerText = "EXTRACTO DE CUENTAS";
        if (modalTitulo) modalTitulo.innerText = "Historial de Movimientos";
        mostrarMovimientosCuentas();
    } else if (tab === 'tarjeta') {
        if (tabCuentas) tabCuentas.className = 'tab-btn';
        if (tabTarjeta) tabTarjeta.className = 'tab-btn tab-btn--activo';
        if (modalBadge) modalBadge.innerText = "ESTADO DE CUENTA TARJETA";
        if (modalTitulo) modalTitulo.innerText = "Compras Diferidas y Cuotas";
        mostrarDetalleTarjeta();
    } else if (tab === 'amortizacion') {
        if (tabCuentas) tabCuentas.className = 'tab-btn';
        if (tabTarjeta) tabTarjeta.className = 'tab-btn';
        if (modalBadge) modalBadge.innerText = "SISTEMA DE AMORTIZACIÓN BANCARIO";
        if (modalTitulo) modalTitulo.innerText = "Tabla de Amortización Francesa";
        mostrarTablaAmortizacion(extraParam);
    }
}

function mostrarMovimientos() {
    if (!clienteActual) {
        alert("Debes iniciar sesión para consultar tus movimientos.");
        return;
    }
    abrirModal('historial');
}

function mostrarMovimientosCuentas() {
    const lista = document.getElementById('historialLista');
    if (!lista || !clienteActual) return;

    const movimientos = [
        ...clienteActual.ahorros.movimientos.map(m => ({ ...m, cuenta: 'Cuenta de Ahorros' })),
        ...clienteActual.corriente.movimientos.map(m => ({ ...m, cuenta: 'Cuenta Corriente' }))
    ];

    if (movimientos.length === 0) {
        lista.innerHTML = `
            <div class="historial-vacio">
                <span style="font-size: 2.2rem; display: block; margin-bottom: 8px;">📑</span>
                No hay transacciones registradas en tus cuentas bancarias todavía.
            </div>
        `;
        return;
    }

    movimientos.reverse();

    let html = `
        <table class="historial-tabla">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Operación / Producto</th>
                    <th>Monto</th>
                    <th>Saldo Resultante</th>
                </tr>
            </thead>
            <tbody>
    `;

    movimientos.forEach(m => {
        const esIngreso = m.tipo.toLowerCase().includes('consignación') || m.tipo.toLowerCase().includes('recibida');
        const claseMonto = esIngreso ? 'historial-item-monto--ingreso' : 'historial-item-monto--egreso';
        const signo = esIngreso ? '+' : '-';
        const saldoRestante = m.saldoRestante !== undefined ? m.saldoRestante : 0;

        html += `
            <tr>
                <td style="font-size: 0.75rem; color: var(--text-muted);">${m.fecha}</td>
                <td>
                    <strong style="color: var(--text-primary); font-size: 0.85rem;">${m.tipo}</strong>
                    <span style="display: block; font-size: 0.72rem; color: var(--text-secondary);">${m.cuenta}</span>
                </td>
                <td class="${claseMonto}" style="font-weight: 700; font-family: 'Outfit', sans-serif;">
                    ${signo}$ ${Number(m.monto).toLocaleString('es-CO')}
                </td>
                <td style="color: var(--text-primary); font-weight: 600; font-family: 'Outfit', sans-serif;">
                    $ ${Number(saldoRestante).toLocaleString('es-CO')}
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    lista.innerHTML = html;
}

function mostrarDetalleTarjeta() {
    const lista = document.getElementById('historialLista');
    if (!lista || !clienteActual) return;

    const compras = clienteActual.tarjeta.compras || [];
    const cupoDisponible = clienteActual.tarjeta.consultarCupoDisponible();
    const comprasActivas = compras.filter(c => c.estado !== "Pagada");
    const totalCuotaMensual = comprasActivas.reduce((acc, c) => acc + (Number(c.valorCuota) || 0), 0);

    let html = `
        <div class="cuotas-summary">
            <div class="cuotas-summary-item">
                <span class="cuotas-summary-item__label">Deuda Total Capital</span>
                <span class="cuotas-summary-item__value" style="color: #93c5fd;">$ ${Number(Math.round(clienteActual.tarjeta.deudaTotal)).toLocaleString('es-CO')}</span>
            </div>
            <div class="cuotas-summary-item">
                <span class="cuotas-summary-item__label">Cupo Disponible</span>
                <span class="cuotas-summary-item__value" style="color: #38bdf8;">$ ${Number(Math.round(cupoDisponible)).toLocaleString('es-CO')}</span>
            </div>
            <div class="cuotas-summary-item">
                <span class="cuotas-summary-item__label">Pago Mes Próximo</span>
                <span class="cuotas-summary-item__value" style="color: #00f0ff;">$ ${Number(Math.round(totalCuotaMensual)).toLocaleString('es-CO')}</span>
            </div>
        </div>
    `;

    if (compras.length === 0) {
        html += `
            <div class="historial-vacio">
                <span style="font-size: 2.2rem; display: block; margin-bottom: 8px;">💳</span>
                No tienes compras diferidas registradas en tu Tarjeta de Crédito.
            </div>
        `;
        lista.innerHTML = html;
        return;
    }

    html += `<div class="compras-grid-container">`;

    compras.slice().reverse().forEach(c => {
        const esPagada = c.estado === "Pagada" || c.cuotasRestantes === 0;
        const pctProgreso = c.cuotas > 0 ? Math.round((c.cuotasPagadas / c.cuotas) * 100) : 100;
        const proximaCuota = c.tablaAmortizacion.find(t => !t.pagada) || {};

        html += `
            <div class="compra-tarjeta-card ${esPagada ? 'compra-tarjeta-card--pagada' : ''}">
                <div class="compra-tarjeta-card__header">
                    <div>
                        <span class="compra-tag">${esPagada ? 'TOTALMENTE CANCELADA' : 'CUOTA ACTIVA'}</span>
                        <h4 style="font-size: 1.05rem; margin-top: 4px; color: var(--text-primary); font-family: 'Outfit', sans-serif;">
                            ${c.descripcion}
                        </h4>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">${c.fecha}</span>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 0.72rem; color: var(--text-secondary); display: block;">Monto Inicial</span>
                        <span style="font-size: 1.15rem; font-weight: 800; color: #38bdf8; font-family: 'Outfit', sans-serif;">
                            $ ${Number(c.monto).toLocaleString('es-CO')}
                        </span>
                    </div>
                </div>

                <!-- Barra de progreso de cuotas -->
                <div class="compra-progreso">
                    <div class="compra-progreso__labels">
                        <span>Progreso: <strong>${c.cuotasPagadas} de ${c.cuotas} cuotas</strong> (${pctProgreso}%)</span>
                        <span>Saldo pendiente: <strong>$ ${Number(Math.round(c.saldoPendienteCapital)).toLocaleString('es-CO')}</strong></span>
                    </div>
                    <div class="compra-progreso__bar">
                        <div class="compra-progreso__fill" style="width: ${pctProgreso}%;"></div>
                    </div>
                </div>

                <!-- Métricas de la compra -->
                <div class="compra-detalles-grid">
                    <div>
                        <span class="compra-detalle-label">Cuota Mensual</span>
                        <span class="compra-detalle-val">$ ${Number(Math.round(c.valorCuota)).toLocaleString('es-CO')}</span>
                    </div>
                    <div>
                        <span class="compra-detalle-label">Tasa de Interés</span>
                        <span class="compra-detalle-val">${c.tasa === 0 ? '0% (Sin interés)' : (c.tasa * 100).toFixed(1) + '% M.V.'}</span>
                    </div>
                    <div>
                        <span class="compra-detalle-label">Total Financiado</span>
                        <span class="compra-detalle-val">$ ${Number(Math.round(c.totalConInteres)).toLocaleString('es-CO')}</span>
                    </div>
                </div>

                <!-- Botones de Acción de la Compra -->
                <div class="compra-card-actions">
                    <button type="button" class="btn-compra-action" onclick="abrirModal('verAmortizacion', '${c.id}')">
                        📊 Ver Tabla de Amortización
                    </button>
                    ${!esPagada ? `
                        <button type="button" class="btn-compra-action btn-compra-action--pay" onclick="pagarCuotaRapida('${c.id}')">
                            💳 Pagar Próxima Cuota ($${Number(Math.round(proximaCuota.cuotaTotal || c.valorCuota)).toLocaleString('es-CO')})
                        </button>
                    ` : `
                        <span class="badge-pagado-completado">✓ Cancelada</span>
                    `}
                </div>
            </div>
        `;
    });

    html += `</div>`;
    lista.innerHTML = html;
}

// Visualización de la Tabla de Amortización Francesa
function mostrarTablaAmortizacion(compraId) {
    const lista = document.getElementById('historialLista');
    if (!lista || !clienteActual) return;

    let compra = clienteActual.tarjeta.compras.find(c => c.id === compraId);
    if (!compra) {
        // Si no se pasó id, tomamos la última compra
        compra = clienteActual.tarjeta.compras[clienteActual.tarjeta.compras.length - 1];
    }

    if (!compra) {
        lista.innerHTML = `<div class="historial-vacio">No hay compras para amortizar.</div>`;
        return;
    }

    let html = `
        <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div>
                <button type="button" class="btn-volver-atras" onclick="cambiarTabHistorial('tarjeta')">
                    ← Volver a Compras
                </button>
                <h3 style="font-size: 1.1rem; color: var(--text-primary); margin-top: 8px;">
                    ${compra.descripcion}
                </h3>
                <span style="font-size: 0.78rem; color: var(--text-secondary);">
                    Plazo: ${compra.cuotas} cuotas | Tasa: ${compra.tasa === 0 ? '0% mensual' : (compra.tasa * 100).toFixed(1) + '% mensual vencido'} | Monto Inicial: $${Number(compra.monto).toLocaleString('es-CO')}
                </span>
            </div>
            <div>
                <span class="badge-amortizacion-tipo">SISTEMA FRANCÉS</span>
            </div>
        </div>

        <table class="historial-tabla tabla-amortizacion">
            <thead>
                <tr>
                    <th>Mes</th>
                    <th>Saldo Inicial</th>
                    <th>Cuota Total</th>
                    <th>Abono Capital</th>
                    <th>Interés</th>
                    <th>Saldo Final</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
    `;

    compra.tablaAmortizacion.forEach(item => {
        html += `
            <tr class="${item.pagada ? 'fila-cuota--pagada' : ''}">
                <td style="font-weight: 700; color: #38bdf8;">Cuota ${item.numeroCuota}</td>
                <td>$ ${Number(Math.round(item.saldoInicial)).toLocaleString('es-CO')}</td>
                <td style="font-weight: 700; color: #00f0ff;">$ ${Number(Math.round(item.cuotaTotal)).toLocaleString('es-CO')}</td>
                <td style="color: #93c5fd;">$ ${Number(Math.round(item.abonoCapital)).toLocaleString('es-CO')}</td>
                <td style="color: #60a5fa;">$ ${Number(Math.round(item.abonoInteres)).toLocaleString('es-CO')}</td>
                <td>$ ${Number(Math.round(item.saldoFinal)).toLocaleString('es-CO')}</td>
                <td>
                    <span class="tag-cuota-status ${item.pagada ? 'tag-cuota-status--pagada' : 'tag-cuota-status--pendiente'}">
                        ${item.pagada ? 'PAGADA' : 'PENDIENTE'}
                    </span>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    lista.innerHTML = html;
}

// Atajo para pagar la próxima cuota de una compra directamente
function pagarCuotaRapida(compraId) {
    if (!clienteActual) return;
    abrirModal('pagarTarjeta');
    const select = document.getElementById('selectOpcionPagoTarjeta');
    if (select) {
        select.value = `cuota:${compraId}`;
        actualizarDetallePagoTarjeta();
    }
}

// Inicialización de escuchas de eventos al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    const montoEl = document.getElementById('modalMonto');
    const cuotasEl = document.getElementById('modalCuotas');

    if (montoEl) {
        montoEl.addEventListener('input', () => {
            if (transaccionActual === 'comprar') actualizarSimuladorCompra();
        });
    }

    if (cuotasEl) {
        cuotasEl.addEventListener('input', () => {
            if (transaccionActual === 'comprar') actualizarSimuladorCompra();
        });
    }
});
