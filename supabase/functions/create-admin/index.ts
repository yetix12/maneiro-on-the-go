import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const adminEmail = 'admin@transporte.com'
    const adminPassword = '12345678'

    // Verificar si el usuario ya existe
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === adminEmail)
    
    if (existingUser) {
      return new Response(
        JSON.stringify({ 
          error: 'El usuario admin ya existe', 
          success: false,
          user_id: existingUser.id 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Crear usuario con email confirmado
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        username: 'admin',
        full_name: 'Administrador General',
        user_type: 'admin'
      }
    })

    if (createError) {
      console.error('Error creating user:', createError)
      throw createError
    }

    const userId = userData.user.id
    console.log('Usuario creado con ID:', userId)

    // Esperar un momento para que el trigger handle_new_user se ejecute
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Actualizar perfil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        username: 'admin',
        full_name: 'Administrador General',
        user_type: 'admin'
      })
      .eq('id', userId)

    if (profileError) {
      console.error('Error updating profile:', profileError)
    }

    // Asignar rol admin_general
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'admin_general'
      })

    if (roleError) {
      console.error('Error assigning role:', roleError)
      throw roleError
    }

    console.log('Rol admin_general asignado correctamente')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuario administrador creado exitosamente',
        user_id: userId,
        email: adminEmail,
        credentials: {
          email: adminEmail,
          password: adminPassword
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error general:', error)
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
