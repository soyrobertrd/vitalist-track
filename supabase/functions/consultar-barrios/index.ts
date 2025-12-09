import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapeo de nombres de municipio a como los espera la API
const MUNICIPIO_API_NAMES: Record<string, string> = {
  "Distrito Nacional": "Distrito Nacional",
  "Santo Domingo Este": "Santo Domingo Este",
  "Santo Domingo Oeste": "Santo Domingo Oeste",
  "Santo Domingo Norte": "Santo Domingo Norte",
  "Boca Chica": "Boca Chica",
  "Los Alcarrizos": "Los Alcarrizos",
  "San Luis": "San Luis",
  "San Antonio de Guerra": "San Antonio de Guerra",
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

    // Usar el nombre del municipio directamente o del mapeo
    const municipioParam = MUNICIPIO_API_NAMES[municipio] || municipio;
    // La API requiere full=1 para obtener los barrios
    const apiUrl = `https://phpstack-616350-6059894.cloudwaysapps.com/api/localizacion.php?full=1&municipio=${encodeURIComponent(municipioParam)}`;
    
    console.log('URL de la API:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
    });

    console.log('Response status:', response.status);
    
    const responseText = await response.text();
    console.log('Response body (first 500 chars):', responseText.substring(0, 500));

    if (!response.ok) {
      console.error('Error en la API de localización:', response.status, responseText);
      return new Response(
        JSON.stringify({ success: false, error: `Error API: ${response.status}`, barrios: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      return new Response(
        JSON.stringify({ success: false, error: 'Error parsing response', barrios: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Extraer todos los barrios de la respuesta
    const barriosSet = new Set<string>();
    
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach((item: any) => {
        if (item.municipios && Array.isArray(item.municipios)) {
          item.municipios.forEach((mun: any) => {
            if (mun.dm && Array.isArray(mun.dm)) {
              mun.dm.forEach((dm: any) => {
                // Barrios directos del DM
                if (dm.barrios && Array.isArray(dm.barrios)) {
                  dm.barrios.forEach((barrio: string) => {
                    if (barrio && typeof barrio === 'string') barriosSet.add(barrio);
                  });
                }
                
                // Barrios dentro de zonas
                if (dm.zonas && Array.isArray(dm.zonas)) {
                  dm.zonas.forEach((zona: any) => {
                    if (zona.barrios && Array.isArray(zona.barrios)) {
                      zona.barrios.forEach((barrio: string) => {
                        if (barrio && typeof barrio === 'string') barriosSet.add(barrio);
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }

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
    console.error('Error general:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage, barrios: [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
