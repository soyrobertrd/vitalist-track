import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { municipio } = await req.json();

    if (!municipio) {
      return new Response(
        JSON.stringify({ success: false, error: 'Municipio es requerido', barrios: [] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Consultando barrios para municipio:', municipio);

    const response = await fetch(
      `https://phpstack-616350-6059894.cloudwaysapps.com/api/localizacion.php?municipio=${encodeURIComponent(municipio)}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Error en la API de localización:', response.status);
      return new Response(
        JSON.stringify({ success: false, error: 'Error al consultar la API', barrios: [] }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Extraer todos los barrios de la respuesta
    const barriosSet = new Set<string>();
    
    data.items?.forEach((item: any) => {
      item.municipios?.forEach((mun: any) => {
        mun.dm?.forEach((dm: any) => {
          // Barrios directos del DM
          dm.barrios?.forEach((barrio: string) => {
            if (barrio) barriosSet.add(barrio);
          });
          
          // Barrios dentro de zonas
          dm.zonas?.forEach((zona: any) => {
            zona.barrios?.forEach((barrio: string) => {
              if (barrio) barriosSet.add(barrio);
            });
          });
        });
      });
    });

    // Ordenar alfabéticamente
    const barrios = Array.from(barriosSet).sort((a, b) => 
      a.localeCompare(b, 'es')
    );

    console.log(`Encontrados ${barrios.length} barrios para ${municipio}`);

    return new Response(
      JSON.stringify({ success: true, barrios }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage, barrios: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
