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
    const { cedula } = await req.json();

    if (!cedula || cedula.length !== 11) {
      return new Response(
        JSON.stringify({ error: 'Cédula inválida. Debe tener 11 dígitos.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Consultando cédula: ${cedula}`);

    // Try OGTIC API first (returns citizen data)
    const apiEndpoints = [
      `https://api.digital.gob.do/v1/citizens/${cedula}`,
      `https://api.digital.gob.do/v3/cedulas/${cedula}`,
    ];

    let data = null;
    let lastError = null;

    for (const endpoint of apiEndpoints) {
      try {
        console.log(`Intentando endpoint: ${endpoint}`);
        const response = await fetch(endpoint, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'HealthCRM/1.0'
          }
        });
        
        if (response.ok) {
          data = await response.json();
          console.log('Datos obtenidos:', JSON.stringify(data));
          break;
        } else {
          console.log(`Endpoint ${endpoint} retornó status: ${response.status}`);
        }
      } catch (e) {
        console.log(`Error en endpoint ${endpoint}:`, e);
        lastError = e;
      }
    }

    if (!data) {
      console.error('No se pudo obtener datos de ningún endpoint');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No se pudo consultar la cédula en ningún servicio',
          message: (lastError as Error)?.message || 'Error desconocido'
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse response based on API format
    let formattedData;
    const info = data.payload || data.data || data;

    if (info.names || info.name || info.nombres) {
      // OGTIC v1 format
      formattedData = {
        success: true,
        message: 'Datos obtenidos correctamente',
        nombres: info.names || info.name || info.nombres || '',
        apellido1: info.firstSurname || info.apellido1 || info.primer_apellido || '',
        apellido2: info.secondSurname || info.apellido2 || info.segundo_apellido || '',
        fecha_nac: info.birthdate || info.fecha_nacimiento || info.fecha_nac || '',
        sexo: (info.sex === 'M' || info.sexo === 'M') ? 'M' : 
              (info.sex === 'F' || info.sexo === 'F') ? 'F' : 
              info.sex || info.sexo || '',
        foto_encoded: info.photo || info.foto || ''
      };
    } else if (info.valid !== undefined) {
      // Validation-only response - cedula exists but no data returned
      formattedData = {
        success: info.valid,
        message: info.valid ? 'Cédula válida pero sin datos disponibles' : 'Cédula inválida',
        nombres: '',
        apellido1: '',
        apellido2: '',
        fecha_nac: '',
        sexo: '',
        foto_encoded: ''
      };
    } else {
      formattedData = {
        success: false,
        message: 'Formato de respuesta no reconocido',
        nombres: '',
        apellido1: '',
        apellido2: '',
        fecha_nac: '',
        sexo: '',
        foto_encoded: ''
      };
    }

    console.log('Respuesta formateada:', JSON.stringify(formattedData));

    return new Response(
      JSON.stringify(formattedData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error en edge function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
