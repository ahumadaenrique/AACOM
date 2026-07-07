'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createAgent } from '@/app/actions/agent'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  type: z.string().min(1, "Por favor selecciona un rol para el agente."),
  systemPrompt: z.string().optional(),
  designStyle: z.string().optional(),
})

export function AgentForm({ 
  agent, 
  deployedTypes = [] 
}: { 
  agent?: any
  deployedTypes?: string[]
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const showExecutive = !deployedTypes.includes("EXECUTIVE_ASSISTANT") || agent?.type === "EXECUTIVE_ASSISTANT";
  const showSocialMedia = !deployedTypes.includes("SOCIAL_MEDIA_MANAGER") || agent?.type === "SOCIAL_MEDIA_MANAGER";
  const showReceptionist = false;

  const allDeployed = !showExecutive && !showSocialMedia && !showReceptionist && !agent?.id;

  // Determine initial type value based on what is available
  let initialType: any = agent?.type;
  if (!initialType) {
    if (showExecutive) initialType = "EXECUTIVE_ASSISTANT";
    else if (showSocialMedia) initialType = "SOCIAL_MEDIA_MANAGER";
    else if (showReceptionist) initialType = "RECEPTIONIST";
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: agent?.name || "",
      type: initialType || "EXECUTIVE_ASSISTANT",
      systemPrompt: agent?.systemPrompt || "",
      designStyle: agent?.designStyle || "Realista",
    },
  })

  const [serverError, setServerError] = useState<string | null>(null)

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    setServerError(null)
    try {
      const formData = new FormData()
      formData.append('name', values.name)
      formData.append('type', values.type)
      if (values.systemPrompt) {
        formData.append('systemPrompt', values.systemPrompt)
      }
      if (values.designStyle) {
        formData.append('designStyle', values.designStyle)
      }
      
      let result;
      if (agent?.id) {
        const { updateAgent } = await import('@/app/actions/agent')
        result = await updateAgent(agent.id, formData)
      } else {
        result = await createAgent(formData)
      }

      if (result && result.error) {
        setServerError(result.error)
      }
    } catch (error) {
      console.error(error)
      setServerError("Ocurrió un error inesperado al guardar.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {serverError && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {serverError}
          </div>
        )}
        {allDeployed && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-200 text-sm leading-relaxed">
            ⚠️ <strong>Todos los roles posibles ya han sido desplegados.</strong> No hay roles pendientes para desplegar un nuevo agente en este momento.
          </div>
        )}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-neutral-200">Nombre del Agente</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Ramón" className="bg-black/50 border-white/10 text-white" {...field} />
              </FormControl>
              <FormDescription className="text-neutral-500">
                Este es el nombre con el que te referirás a este agente.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {!agent?.id && (
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-neutral-200">Rol del Agente</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value} 
                  value={field.value}
                  disabled={allDeployed}
                >
                  <FormControl>
                    <SelectTrigger className="bg-black/50 border-white/10 text-white">
                      <SelectValue placeholder={allDeployed ? "No hay roles pendientes" : "Selecciona un rol"}>
                        {field.value === "EXECUTIVE_ASSISTANT" && "Asistente Ejecutiva"}
                        {field.value === "SOCIAL_MEDIA_MANAGER" && "Social Media Manager"}
                        {field.value === "RECEPTIONIST" && "Recepcionista (Voz)"}
                        {!field.value && "Selecciona un rol"}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-neutral-900 border-white/10 text-white">
                    {showExecutive && <SelectItem value="EXECUTIVE_ASSISTANT">Asistente Ejecutiva</SelectItem>}
                    {showSocialMedia && <SelectItem value="SOCIAL_MEDIA_MANAGER">Social Media Manager</SelectItem>}
                    {showReceptionist && <SelectItem value="RECEPTIONIST">Recepcionista (Voz)</SelectItem>}
                  </SelectContent>
                </Select>
                <FormDescription className="text-neutral-500">
                  El rol define las capacidades e integraciones automáticas del agente.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {form.watch("type") === "SOCIAL_MEDIA_MANAGER" && (
          <FormField
            control={form.control}
            name="designStyle"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-neutral-200">Estilo de Diseño (Imágenes)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-black/50 border-white/10 text-white">
                      <SelectValue placeholder="Selecciona un estilo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-neutral-900 border-white/10 text-white">
                    <SelectItem value="Realista">Realista / Fotográfico</SelectItem>
                    <SelectItem value="Ilustración">Ilustración / Flat Design</SelectItem>
                    <SelectItem value="3D">3D Renderizado</SelectItem>
                    <SelectItem value="Cinemático">Cinemático / Épico</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-neutral-500">
                  El estilo artístico que usará este agente al generar piezas gráficas.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="systemPrompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-neutral-200">Personalidad / Instrucciones Extra (Opcional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Ej. Eres muy amable y siempre terminas tus frases con un chiste." 
                  className="bg-black/50 border-white/10 text-white resize-none" 
                  rows={4}
                  {...field} 
                />
              </FormControl>
              <FormDescription className="text-neutral-500">
                Déjalo en blanco para usar la personalidad optimizada por defecto.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={isSubmitting || allDeployed}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-6 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(79,70,229,0.3)]"
        >
          {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          {agent?.id ? "Guardar Cambios" : "Desplegar Agente"}
        </Button>
      </form>
    </Form>
  )
}
