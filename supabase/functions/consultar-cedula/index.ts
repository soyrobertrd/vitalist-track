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

    // Note: The OGTIC API (api.digital.gob.do) requires authentication/API keys
    // and is not publicly accessible. This function will return a graceful response
    // indicating the service is unavailable, allowing manual data entry.
    
    // If you have OGTIC API credentials, add them here:
    // const OGTIC_API_KEY = Deno.env.get('OGTIC_API_KEY');
    
    const apiEndpoints = [
      `https://api.digital.gob.do/v3/cedulas/${cedula}/validate`,
      `https://api.digital.gob.do/v1/citizens/${cedula}`,
    ];

    let data = null;
    let lastError = null;

    for (const endpoint of apiEndpoints) {
      try {
        console.log(`Intentando endpoint: ${endpoint}`);
        const response = await fetch(endpoint, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'HealthCRM/1.0',
            // If you have an API key, uncomment:
            // 'Authorization': `Bearer ${OGTIC_API_KEY}`,
          }
        });
        
        console.log(`Endpoint ${endpoint} retornó status: ${response.status}`);
        
        if (response.ok) {
          data = await response.json();
          console.log('Datos obtenidos:', JSON.stringify(data));
          break;
        } else if (response.status === 401 || response.status === 403) {
          console.log('API requiere autenticación');
          lastError = new Error('API requiere autenticación');
        } else if (response.status === 404) {
          console.log('Cédula no encontrada o endpoint no disponible');
        }
      } catch (e) {
        console.log(`Error en endpoint ${endpoint}:`, e);
        lastError = e;
      }
    }

    // If no data was obtained, return a graceful response
    if (!data) {
      console.log('Servicio de consulta de cédula no disponible - permitiendo entrada manual');
      return new Response(
        JSON.stringify({ 
          success: false, 
          available: false,
          message: 'El servicio de consulta de cédula no está disponible. Por favor, ingrese los datos manualmente.',
          nombres: '',
          apellido1: '',
          apellido2: '',
          fecha_nac: '',
          sexo: '',
          foto_encoded: ''
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse response based on API format
    let formattedData;
    const info = data.payload || data.data || data;

    if (info.names || info.name || info.nombres) {
      formattedData = {
        success: true,
        available: true,
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
      formattedData = {
        success: info.valid,
        available: true,
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
        available: false,
        message: 'Formato de respuesta no reconocido. Ingrese los datos manualmente.',
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
        available: false,
        message: 'Error en el servicio. Por favor, ingrese los datos manualmente.',
        nombres: '',
        apellido1: '',
        apellido2: '',
        fecha_nac: '',
        sexo: '',
        foto_encoded: ''
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
