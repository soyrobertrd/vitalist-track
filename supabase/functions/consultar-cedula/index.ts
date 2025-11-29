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

    // JCE API endpoint
    const apiUrl = `http://190.122.98.11:11080/jce/api/citizen/${cedula}`;
    
    try {
      console.log(`Llamando a JCE API: ${apiUrl}`);
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
        }
      });
      
      console.log(`JCE API status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Datos JCE:', JSON.stringify(data));
        
        if (data.success && data.citizenInfo) {
          const info = data.citizenInfo;
          
          // Parse fecha_nac from "9/20/1984 12:00:00 AM" to "1984-09-20"
          let fechaNac = '';
          if (info.fecha_nac) {
            const datePart = info.fecha_nac.split(' ')[0];
            const [month, day, year] = datePart.split('/');
            fechaNac = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
          
          return new Response(
            JSON.stringify({
              success: true,
              available: true,
              message: 'Datos obtenidos correctamente',
              nombres: info.nombres || '',
              apellido1: info.apellido1 || '',
              apellido2: info.apellido2 || '',
              fecha_nac: fechaNac,
              sexo: info.sexo || '',
              foto_encoded: info.foto_encoded || ''
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      // If we get here, the API didn't return valid data
      console.log('JCE API no devolvió datos válidos');
      return new Response(
        JSON.stringify({ 
          success: false, 
          available: false,
          message: 'No se encontraron datos para esta cédula. Por favor, ingrese los datos manualmente.',
          nombres: '',
          apellido1: '',
          apellido2: '',
          fecha_nac: '',
          sexo: '',
          foto_encoded: ''
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } catch (fetchError) {
      console.error('Error al llamar JCE API:', fetchError);
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