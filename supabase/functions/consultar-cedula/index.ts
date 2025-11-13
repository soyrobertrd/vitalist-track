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

    const response = await fetch(`http://190.122.98.11:11080/jce/api/citizen/${cedula}`);
    
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
    console.log('Datos obtenidos de JCE:', data);

    // Extraer y formatear los datos relevantes
    const citizenInfo = data.citizenInfo || {};
    const formattedData = {
      success: data.success,
      message: data.message,
      nombres: citizenInfo.nombres || '',
      apellido1: citizenInfo.apellido1 || '',
      apellido2: citizenInfo.apellido2 || '',
      fecha_nac: citizenInfo.fecha_nac || '',
      sexo: citizenInfo.ced_a_sexo || citizenInfo.sexo || '',
      foto_encoded: citizenInfo.foto_encoded || ''
    };

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
