'use client'
import { TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info, Trash2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip"
import { Button } from "../../components/ui/button"
import {
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts'
import { comunidades, tramosEstatales } from '../../data/data'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

type ComunidadAutonoma = keyof typeof comunidades;

const isValidComunidad = (value: string): value is ComunidadAutonoma => {
  return value in comunidades;
};

export default function Component() {
  const [salarioBrutoInicial, setSalarioBrutoInicial] = useState(30000)
  const [salarioBruto, setSalarioBruto] = useState(30000)
  const [comunidad, setComunidad] = useState<ComunidadAutonoma>("Madrid");
  const [salarioNeto, setSalarioNeto] = useState(0)
  const [desglose, setDesglose] = useState({ irpfEstatal: 0, irpfAutonomico: 0, ss: 0 })
  const [porcentajeAumento, setPorcentajeAumento] = useState(0)
  const [historialAumentos, setHistorialAumentos] = useState<Aumento[]>([]);
  const [porcentajeImpuestos, setPorcentajeImpuestos] = useState(0)

  function calcularPorcentajeImpuestos(
    salarioBrutoNuevo: number, 
    salarioNetoNuevo: number, 
    salarioBrutoAnterior: number, 
    salarioNetoAnterior: number
  ): number {
      const totalImpuestosNuevo = salarioBrutoNuevo - salarioNetoNuevo;
      const totalImpuestosAnterior = salarioBrutoAnterior - salarioNetoAnterior;
      return calcularPorcentajeAumento(totalImpuestosNuevo, totalImpuestosAnterior);
  }
  

  const calcularPorcentajeAumento = (nuevo: number, anterior: number): number => {
    if (anterior === 0) return nuevo === 0 ? 0 : 100;
    return ((nuevo - anterior) / anterior) * 100;
  }
  
  
  const calcularSalarioNeto = (salario: number) => {
    const baseImponible = salario - (salario * 0.0635)
    let irpfEstatal = 0
    let irpfAutonomico = 0
    let baseAcumulada = 0

    for (const tramo of tramosEstatales) {
      const baseTramo = Math.min(baseImponible - baseAcumulada, tramo.hasta - baseAcumulada)
      if (baseTramo > 0) {
        irpfEstatal += baseTramo * (tramo.tipo / 100)
        baseAcumulada += baseTramo
      } else {
        break
      }
    }

    baseAcumulada = 0
    for (const tramo of comunidades[comunidad]) {
      const baseTramo = Math.min(baseImponible - baseAcumulada, tramo.hasta - baseAcumulada)
      if (baseTramo > 0) {
        irpfAutonomico += baseTramo * (tramo.tipo / 100)
        baseAcumulada += baseTramo
      } else {
        break
      }
    }

    const ss = salario * 0.0635
    const neto = salario - irpfEstatal - irpfAutonomico - ss

    return { neto, irpfEstatal, irpfAutonomico, ss }
  }

  useEffect(() => {
    const resultado = calcularSalarioNeto(salarioBruto);
    setDesglose({
      irpfEstatal: Math.round(resultado.irpfEstatal),
      irpfAutonomico: Math.round(resultado.irpfAutonomico),
      ss: Math.round(resultado.ss)
    });

    // Calculate total impuestos *before* rounding net salary
    const totalImpuestos = resultado.irpfEstatal + resultado.irpfAutonomico + resultado.ss;
    setPorcentajeImpuestos((totalImpuestos / salarioBruto) * 100);

    // Now round and set the net salary
    setSalarioNeto(Math.round(salarioBruto - totalImpuestos)); // Calculate neto based on unrounded impuestos

  }, [salarioBruto, comunidad])


  interface Aumento {
    fecha: string;
    salarioBrutoAnterior: number;
    salarioBrutoNuevo: number;
    salarioNetoAnterior: number;
    salarioNetoNuevo: number;
    irpfEstatalAnterior: number;
    irpfEstatalNuevo: number;
    irpfAutonomicoAnterior: number;
    irpfAutonomicoNuevo: number;
    ssAnterior: number;
    ssNuevo: number;
    porcentajeAumento: number;
  }
  
  const handleAumentoSalario = () => {
    const nuevoSalarioBruto = Math.round(salarioBruto * (1 + porcentajeAumento / 100))
    const resultadoActual = calcularSalarioNeto(salarioBruto)
    const resultadoNuevo = calcularSalarioNeto(nuevoSalarioBruto)

    const nuevoAumento = {
      fecha: new Date().toISOString(),
      salarioBrutoAnterior: salarioBruto,
      salarioBrutoNuevo: nuevoSalarioBruto,
      salarioNetoAnterior: Math.round(resultadoActual.neto),
      salarioNetoNuevo: Math.round(resultadoNuevo.neto),
      irpfEstatalAnterior: Math.round(resultadoActual.irpfEstatal),
      irpfEstatalNuevo: Math.round(resultadoNuevo.irpfEstatal),
      irpfAutonomicoAnterior: Math.round(resultadoActual.irpfAutonomico),
      irpfAutonomicoNuevo: Math.round(resultadoNuevo.irpfAutonomico),
      ssAnterior: Math.round(resultadoActual.ss),
      ssNuevo: Math.round(resultadoNuevo.ss),
      porcentajeAumento: Math.round(porcentajeAumento)
    }

    setHistorialAumentos([...historialAumentos, nuevoAumento])
    setSalarioBruto(nuevoSalarioBruto)
    setPorcentajeAumento(0)
  }

  const eliminarAumento = (index: number) => {
    const nuevosAumentos = [...historialAumentos]
    nuevosAumentos.splice(index, 1)
    setHistorialAumentos(nuevosAumentos)

    if (index === 0 && nuevosAumentos.length === 0) {
      setSalarioBruto(salarioBrutoInicial)
    } else if (index === nuevosAumentos.length) {
      setSalarioBruto(nuevosAumentos[nuevosAumentos.length - 1].salarioBrutoNuevo)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0, // Always show at least 0 decimal places
      maximumFractionDigits: 0, // Round to nearest whole number for display, but don't hide thousands separator
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  interface PayloadData {
      nombre: string;
      bruto: number;
      neto: number;
      totalImpuestos: number;
      irpfEstatal: number;
      irpfAutonomico: number;
      ss: number;
      initialBruto: number;
      initialNeto: number;
      initialTotalImpuestos: number;
      initialIrpfEstatal: number;
      initialIrpfAutonomico: number;
      initialSS: number;
  }
  

  const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as PayloadData; // Type assertion here
      // Your existing tooltip rendering logic here
      return (
        <div className="bg-white p-4 border rounded shadow space-y-4">
          <h3 className="text-lg font-bold text-purple-800">{label}</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-indigo-600">Salario Bruto</h4>
              <p>{formatCurrency(data.bruto)}</p>
              {data.nombre !== 'Inicial' && (
                <p className="text-sm text-gray-600">
                  (+{formatPercentage(calcularPorcentajeAumento(data.bruto, data.initialBruto))})
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">Salario Neto</h4>
              <p>{formatCurrency(data.neto)}</p>
              {data.nombre !== 'Inicial' && (
                <p className="text-sm text-gray-600">
                  (+{formatPercentage(calcularPorcentajeAumento(data.neto, data.initialNeto))})
                </p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-red-600">Impuestos</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p>IRPF Estatal:</p>
                <p>{formatCurrency(data.irpfEstatal)}</p>
                {data.nombre !== 'Inicial' && (
                  <p className="text-gray-600">
                    (+{formatPercentage(calcularPorcentajeAumento(data.irpfEstatal, data.initialIrpfEstatal))})
                  </p>
                )}
              </div>
              <div>
                <p>IRPF Autonómico:</p>
                <p>{formatCurrency(data.irpfAutonomico)}</p>
                {data.nombre !== 'Inicial' && (
                  <p className="text-gray-600">
                    (+{formatPercentage(calcularPorcentajeAumento(data.irpfAutonomico, data.initialIrpfAutonomico))})
                  </p>
                )}
              </div>
              <div>
                <p>Seguridad Social:</p>
                <p>{formatCurrency(data.ss)}</p>
                {data.nombre !== 'Inicial' && (
                  <p className="text-gray-600">
                    (+{formatPercentage(calcularPorcentajeAumento(data.ss, data.initialSS))})
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="pt-2 border-t">
            <h4 className="font-semibold text-red-800">Total Impuestos</h4>
            <p>{formatCurrency(data.totalImpuestos)}</p>
            {data.nombre !== 'Inicial' && (
              <p className="text-sm text-gray-600">
                (+{formatPercentage(calcularPorcentajeAumento(data.totalImpuestos, data.initialTotalImpuestos))})
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-200 flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-purple-800">Calculadora de Salario Neto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="space-y-2">
              <Label htmlFor="salario-bruto">Salario Bruto Anual</Label>
              <Input
                id="salario-bruto"
                type="number"
                value={salarioBruto}
                onChange={(e) => {
                  const value = Number(e.target.value)
                  setSalarioBruto(value)
                  setSalarioBrutoInicial(value)
                }}
                className="text-lg"
              />
            </div>
           
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="comunidad">Comunidad Autónoma</Label>
              <Select value={comunidad} onValueChange={(value: string) => {
                  if (isValidComunidad(value)) {
                    setComunidad(value);
                  } else {
                    // Handle the invalid value (e.g., log an error, set a default)
                    console.error("Invalid comunidad value:", value);
                    setComunidad("Madrid"); // Or other default
                  }
                }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(comunidades).map((com) => (
                    <SelectItem key={com} value={com}>
                      {com}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Main Results Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Net Salary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-purple-800">Salario Neto Anual</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-4xl font-bold text-indigo-600">
                  {formatCurrency(salarioNeto)}
                </p>
                <p className="text-lg font-semibold mt-2">
                  Total Impuestos: {formatCurrency(salarioBruto - salarioNeto)} ({formatPercentage(porcentajeImpuestos)})
                </p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Net Salary Breakdown (IRPF Estatal, IRPF Autonómico, SS) - with Tooltips */}
                  {Object.entries(desglose).map(([key, value]) => (
                    <TooltipProvider key={key}>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex flex-col items-center">
                            <Info className="w-4 h-4 mb-1 text-purple-600" />
                            <span className="text-sm font-semibold text-gray-700">
                              {key === 'irpfEstatal' ? 'IRPF Estatal' :
                                key === 'irpfAutonomico' ? 'IRPF Autonómico' :
                                  'Seguridad Social'}
                            </span>
                            <span className="text-sm text-gray-600">
                              {formatCurrency(value)}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({formatPercentage((value / salarioBruto) * 100)})
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {key === 'irpfEstatal' ? 'Impuesto sobre la Renta de las Personas Físicas (Parte Estatal)' :
                              key === 'irpfAutonomico' ? 'Impuesto sobre la Renta de las Personas Físicas (Parte Autonómica)' :
                                'Seguridad Social'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Salary Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-purple-800">Distribución del Salario</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Neto', value: salarioNeto },
                        { name: 'IRPF Estatal', value: desglose.irpfEstatal },
                        { name: 'IRPF Autonómico', value: desglose.irpfAutonomico },
                        { name: 'Seguridad Social', value: desglose.ss },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${formatPercentage(percent * 100)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {
                        [
                          { name: 'Neto', value: salarioNeto },
                          { name: 'IRPF Estatal', value: desglose.irpfEstatal },
                          { name: 'IRPF Autonómico', value: desglose.irpfAutonomico },
                          { name: 'Seguridad Social', value: desglose.ss },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))
                      }
                    </Pie>
                    <RechartsTooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            </motion.div>

            {/* Salary Increase Simulation Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="aumento-salario">Simulación de Aumento de Salario (%)</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="aumento-salario"
                    type="number"
                    value={porcentajeAumento}
                    onChange={(e) => setPorcentajeAumento(Number(e.target.value))}
                    className="text-lg"
                  />
                  <Button onClick={handleAumentoSalario}>Simular</Button>
                </div>
              </div>

              {/* Salary Increase History */}
              <AnimatePresence>
                {historialAumentos.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <h3 className="text-xl font-semibold text-purple-800 mb-4">Historial de Aumentos</h3>
                    <div className="space-y-4">
                      {historialAumentos.map((aumento, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3 }}
                          className="bg-white p-4 rounded-lg shadow"
                        >
                          <div className="flex justify-between items-start">
                            <h3 className="text-lg font-bold text-purple-800 mb-2">Aumento {index + 1}: {formatPercentage(aumento.porcentajeAumento)}</h3>
                            <Button variant="ghost" size="icon" onClick={() => eliminarAumento(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-indigo-600">Salario Bruto</h4>
                              <p>{formatCurrency(aumento.salarioBrutoAnterior)} → {formatCurrency(aumento.salarioBrutoNuevo)}</p>
                              <p className="text-sm text-gray-600">
                                (+{formatPercentage((aumento.salarioBrutoNuevo - aumento.salarioBrutoAnterior) / aumento.salarioBrutoAnterior * 100)})
                              </p>
                            </div>
                            
                            <div className="space-y-2">
                              <h4 className="font-semibold text-green-600">Salario Neto</h4>
                              <p>{formatCurrency(aumento.salarioNetoAnterior)} → {formatCurrency(aumento.salarioNetoNuevo)}</p>
                              <p className="text-sm text-gray-600">
                                (+{formatPercentage((aumento.salarioNetoNuevo - aumento.salarioNetoAnterior) / aumento.salarioNetoAnterior * 100)})
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-4 space-y-2">
                            <h4 className="font-semibold text-red-600">Impuestos</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                              <div>
                                <p>IRPF Estatal:</p>
                                <p>{formatCurrency(aumento.irpfEstatalAnterior)} → {formatCurrency(aumento.irpfEstatalNuevo)}</p>
                                <p className="text-gray-600">
                                  (+{formatPercentage(calcularPorcentajeAumento(aumento.irpfEstatalNuevo, aumento.irpfEstatalAnterior))})
                                </p>
                              </div>
                              <div>
                                <p>IRPF Autonómico:</p>
                                <p>{formatCurrency(aumento.irpfAutonomicoAnterior)} → {formatCurrency(aumento.irpfAutonomicoNuevo)}</p>
                                <p className="text-gray-600">
                                  (+{formatPercentage(calcularPorcentajeAumento(aumento.irpfAutonomicoNuevo, aumento.irpfAutonomicoAnterior))})
                                </p>
                              </div>
                              <div>
                                <p>Seguridad Social:</p>
                                <p>{formatCurrency(aumento.ssAnterior)} → {formatCurrency(aumento.ssNuevo)}</p>
                                <p className="text-gray-600">
                                  (+{formatPercentage(calcularPorcentajeAumento(aumento.ssNuevo, aumento.ssAnterior))})
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-2 border-t">
                            <h4 className="font-semibold text-red-800">Total Impuestos</h4>
                            <p>
                              {formatCurrency(aumento.salarioBrutoAnterior - aumento.salarioNetoAnterior)} → 
                              {formatCurrency(aumento.salarioBrutoNuevo - aumento.salarioNetoNuevo)}
                            </p>
                            <p className="text-sm text-gray-600">
                              (+{formatPercentage(calcularPorcentajeImpuestos(aumento.salarioBrutoNuevo, aumento.salarioNetoNuevo, aumento.salarioBrutoAnterior, aumento.salarioNetoAnterior))})
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Salary Evolution Chart */}
              {historialAumentos.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h3 className="text-xl font-semibold text-purple-800 mb-4">Evolución del Salario</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart
                      data={[
                        {
                          nombre: 'Inicial',
                          bruto: salarioBrutoInicial,
                          neto: calcularSalarioNeto(salarioBrutoInicial).neto,
                          totalImpuestos: salarioBrutoInicial - calcularSalarioNeto(salarioBrutoInicial).neto,
                          irpfEstatal: calcularSalarioNeto(salarioBrutoInicial).irpfEstatal,
                          irpfAutonomico: calcularSalarioNeto(salarioBrutoInicial).irpfAutonomico,
                          ss: calcularSalarioNeto(salarioBrutoInicial).ss,
                          initialBruto: salarioBrutoInicial,
                          initialNeto: calcularSalarioNeto(salarioBrutoInicial).neto,
                          initialTotalImpuestos: salarioBrutoInicial - calcularSalarioNeto(salarioBrutoInicial).neto,
                          initialIrpfEstatal: calcularSalarioNeto(salarioBrutoInicial).irpfEstatal,
                          initialIrpfAutonomico: calcularSalarioNeto(salarioBrutoInicial).irpfAutonomico,
                          initialSS: calcularSalarioNeto(salarioBrutoInicial).ss
                        },
                        ...historialAumentos.map((aumento, index) => ({
                          nombre: `Aumento ${index + 1}`,
                          bruto: aumento.salarioBrutoNuevo,
                          neto: aumento.salarioNetoNuevo,
                          totalImpuestos: aumento.salarioBrutoNuevo - aumento.salarioNetoNuevo,
                          irpfEstatal: aumento.irpfEstatalNuevo,
                          irpfAutonomico: aumento.irpfAutonomicoNuevo,
                          ss: aumento.ssNuevo,
                          initialBruto: salarioBrutoInicial,
                          initialNeto: calcularSalarioNeto(salarioBrutoInicial).neto,
                          initialTotalImpuestos: salarioBrutoInicial - calcularSalarioNeto(salarioBrutoInicial).neto,
                          initialIrpfEstatal: calcularSalarioNeto(salarioBrutoInicial).irpfEstatal,
                          initialIrpfAutonomico: calcularSalarioNeto(salarioBrutoInicial).irpfAutonomico,
                          initialSS: calcularSalarioNeto(salarioBrutoInicial).ss
                        }))
                      ]}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nombre" />
                      <YAxis />
                      <RechartsTooltip content={(props: TooltipProps<ValueType, NameType>) => <CustomTooltip {...props} />} />

                      <Legend />
                      <Area type="monotone" dataKey="totalImpuestos" name="Total Impuestos" stackId="2" stroke="#ffc658" fill="#ffc658" />
                      <Area type="monotone" dataKey="neto" name="Salario Neto" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
            </motion.div>
            </CardContent>
            </Card>
            </div>
  )
}