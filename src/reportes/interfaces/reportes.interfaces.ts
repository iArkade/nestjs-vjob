
export interface ProfitAndLossItem {
    code: string;
    name: string;
    level: number;
    monthly: number;
    total: number;
    isHeader: boolean;
    isIncome: boolean;
    isExpense: boolean;
}

export interface BalanceGeneralItem {
    code: string;
    name: string;
    level: number;
    total: number;
    isHeader: boolean;
    isAsset: boolean;
    isLiability: boolean;
    isEquity: boolean;
}

export interface LibroDiarioItem {
    id: number;
    fecha_emision: Date;
    nro_asiento: string;
    codigo_transaccion: string;
    comentario: string;
    nro_referencia: string;
    total_debe: number;
    total_haber: number;
    items: Array<{
        cta: string;
        cta_nombre: string;
        codigo_centro: string;
        debe: number;
        haber: number;
        nota: string;
    }>;
}

export interface MayorGeneralItem {
    cuenta: string;
    saldoInicial: number;
    movimientos: Array<{
        fecha: Date;
        nro_asiento: string;
        descripcion: string;
        nota: string;
        debe: number;
        haber: number;
        saldo?: number;
    }>;
}

export interface BalanceComprobacionItem {
    codigo: string;
    nombre: string;
    saldoAnteriorDebe: number;
    saldoAnteriorHaber: number;
    movimientosDebe: number;
    movimientosHaber: number;
    saldoDebe: number;
    saldoHaber: number;
    tipoCuenta: 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto';
    level: number;
}