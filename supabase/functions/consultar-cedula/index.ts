import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cedula } = await req.json();

    if (!cedula || cedula.length !== 11) {
      return new Response(
        JSON.stringify({ error: 'Cédula inválida. Debe tener 11 dígitos.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Consultando cédula: ${cedula}`);

    // Try multiple API endpoints
    let response;
    try {
      response = await fetch(`https://api.digital.gob.do/v3/cedulas/${cedula}/validate`);
    } catch (e) {
      // Fallback to alternative endpoint
      response = await fetch(`http://190.122.98.11:11080/jce/api/citizen/${cedula}`);
    }
    
    if (!response.ok) {
      console.error(`Error al consultar JCE: ${response.status}`);
      return new Response(
        JSON.stringify({ error: 'No se pudo consultar la cédula' }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    console.log('Datos obtenidos de API:', data);

    // Handle different API response formats
    let formattedData;
    
    // OGTIC API format
    if (data.data) {
      const info = data.data;
      formattedData = {
        success: true,
        message: 'Datos obtenidos correctamente',
        nombres: info.nombres || info.name || '',
        apellido1: info.apellido1 || info.primer_apellido || '',
        apellido2: info.apellido2 || info.segundo_apellido || '',
        fecha_nac: info.fecha_nacimiento || info.fecha_nac || '',
        sexo: info.sexo === 'M' ? 'Masculino' : info.sexo === 'F' ? 'Femenino' : info.sexo || '',
        foto_encoded: info.foto || info.foto_encoded || ''
      };
    } else {
      // JCE API format (legacy)
      const citizenInfo = data.citizenInfo || data || {};
      formattedData = {
        success: data.success !== false,
        message: data.message || 'Datos obtenidos correctamente',
        nombres: citizenInfo.nombres || '',
        apellido1: citizenInfo.apellido1 || '',
        apellido2: citizenInfo.apellido2 || '',
        fecha_nac: citizenInfo.fecha_nac || '',
        sexo: citizenInfo.ced_a_sexo || citizenInfo.sexo || '',
        foto_encoded: citizenInfo.foto_encoded || ''
      };
    }

    return new Response(
      JSON.stringify(formattedData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error en edge function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
