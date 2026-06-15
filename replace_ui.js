const fs = require('fs');
const file = './src/app/(dashboard)/admin/AdminClient.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetStr = \<div className="max-w-xl mx-auto">\;
// Need to match exactly what is there. I will find the activeTab block from my grep output.
const beforeTarget = \{activeTab === "notificaciones" && (\;
const afterTarget = \}

        {/* Styles inject for print layout within Admin preview */}\;

const start = code.indexOf(beforeTarget);
const end = code.indexOf(afterTarget);

if (start === -1 || end === -1) {
    console.error("Failed");
    process.exit(1);
}

const replacement = \{activeTab === "notificaciones" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="max-w-xl mx-auto space-y-6">
              
              {/* Toggles del Sistema */}
              <Card className="border shadow-sm">
                <CardHeader className="bg-slate-50 border-b pb-4">
                  <CardTitle className="text-lg font-black text-slate-700 flex items-center gap-2">
                    <BellRing className="h-5 w-5" /> Notificaciones Automáticas (Sistema)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-xl">
                    <div>
                      <h4 className="font-bold text-sm">Validación 25 Puntos</h4>
                      <p className="text-xs text-slate-500">Alerta de Lunes a Viernes a las 5:00 PM</p>
                    </div>
                    <Button variant={pushPointsEnabled ? "default" : "outline"} onClick={handleTogglePointsSetting} className={pushPointsEnabled ? "bg-teal-600 hover:bg-teal-700 text-white" : ""}>
                      {pushPointsEnabled ? "Encendida" : "Apagada"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-xl">
                    <div>
                      <h4 className="font-bold text-sm">Planeación Diaria</h4>
                      <p className="text-xs text-slate-500">Alerta de Lunes a Viernes a las 8:30 AM</p>
                    </div>
                    <Button variant={pushPlanningEnabled ? "default" : "outline"} onClick={handleTogglePlanningSetting} className={pushPlanningEnabled ? "bg-teal-600 hover:bg-teal-700 text-white" : ""}>
                      {pushPlanningEnabled ? "Encendida" : "Apagada"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Crear / Enviar Push */}
              <Card className="border shadow-sm border-blue-100 dark:border-blue-900/30">
                <CardHeader className="bg-blue-50/50 dark:bg-blue-950/20 border-b pb-4">
                  <CardTitle className="text-lg font-black text-blue-700 dark:text-blue-400 flex items-center gap-2">
                    <BellRing className="h-5 w-5" /> Enviar o Programar Notificación Push
                  </CardTitle>
                  <CardDescription>
                    Envía un mensaje al instante o prográmalo para que se envíe automáticamente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Destinatario</label>
                      <select
                        className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400"
                        value={pushRecipient}
                        onChange={(e) => setPushRecipient(e.target.value)}
                      >
                        <option value="ALL">?? Todos los agentes</option>
                        {usersList.filter(u => u.role === 'AGENTE' && u.active).map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Mensaje a mostrar</label>
                      <Input 
                        placeholder="Ej. ¡Último día de cierre! Manda tus cotizaciones antes de las 4 PM." 
                        value={pushMessage}
                        onChange={(e) => setPushMessage(e.target.value)}
                        maxLength={150}
                        className="rounded-xl border-slate-200"
                      />
                      <p className="text-xs text-muted-foreground text-right">{pushMessage.length}/150</p>
                    </div>
  
                    <div className="space-y-2 border-t pt-4">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">¿Cuándo enviar?</label>
                      <select
                        className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-teal-600"
                        value={schedFreq}
                        onChange={(e) => setSchedFreq(e.target.value)}
                      >
                        <option value="NOW">En este momento</option>
                        <option value="ONCE">Una sola vez en el futuro</option>
                        <option value="DAILY">Diario (Lunes a Viernes)</option>
                      </select>
                    </div>

                    {schedFreq !== "NOW" && (
                      <div className="flex gap-3">
                        <div className="flex-1 space-y-2">
                          <label className="text-xs font-bold text-slate-500">Hora (México)</label>
                          <select
                            className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                            value={schedHour}
                            onChange={(e) => setSchedHour(e.target.value)}
                          >
                            {[...Array(24)].map((_, i) => (
                              <option key={i} value={i}>{i === 0 ? "12 AM" : i < 12 ? \\\\\\ AM\\\ : i === 12 ? "12 PM" : \\\\\\ PM\\\}</option>
                            ))}
                          </select>
                        </div>
                        {schedFreq === "ONCE" && (
                          <div className="flex-1 space-y-2">
                            <label className="text-xs font-bold text-slate-500">Fecha</label>
                            <Input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} className="rounded-xl" />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2 border-t pt-4">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">PIN de Autorización</label>
                      <Input 
                        type="password"
                        placeholder="Ingresa el PIN de seguridad de 10 dígitos" 
                        value={pushPin}
                        onChange={(e) => setPushPin(e.target.value)}
                        className="rounded-xl border-slate-200"
                      />
                    </div>
  
                    {pushStatus && (
                      <div className={\p-3 rounded-lg text-sm font-semibold text-center \\}>
                        {pushStatus}
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      {schedFreq === "NOW" ? (
                        <Button onClick={handleSendPush} disabled={pushLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11">
                          {pushLoading ? "Enviando..." : "Enviar Ahora Mismo"}
                        </Button>
                      ) : (
                        <Button onClick={handleCreateSchedule} disabled={pushLoading} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl h-11">
                          {pushLoading ? "Programando..." : "Guardar Programación"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Notificaciones Programadas */}
              {scheduledPushes.length > 0 && (
                <Card className="border shadow-sm">
                  <CardHeader className="bg-slate-50 border-b py-3">
                    <CardTitle className="text-sm font-bold text-slate-700">Notificaciones Programadas</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mensaje</TableHead>
                          <TableHead>Frecuencia / Hora</TableHead>
                          <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scheduledPushes.map(sp => (
                          <TableRow key={sp.id}>
                            <TableCell className="text-xs">{sp.message}</TableCell>
                            <TableCell className="text-xs">
                              {sp.frequency === 'DAILY' ? 'Diario (L-V)' : \\\Una vez (\\\)\\\} <br/>
                              a las {sp.timeHour === 0 ? "12 AM" : sp.timeHour < 12 ? \\\\\\ AM\\\ : sp.timeHour === 12 ? "12 PM" : \\\\\\ PM\\\}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteSchedule(sp.id)} className="text-red-500 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )
\;

code = code.substring(0, start) + replacement + code.substring(end);
fs.writeFileSync(file, code);
console.log("UI Patched completely");
