-- Create table for driver payment methods
CREATE TABLE public.driver_payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('pago_movil', 'transferencia')),
    -- Pago Movil fields
    pm_telefono TEXT,
    pm_cedula TEXT,
    pm_banco TEXT,
    -- Transferencia fields
    tf_banco TEXT,
    tf_tipo_cuenta TEXT,
    tf_numero_cuenta TEXT,
    tf_titular TEXT,
    tf_cedula TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(driver_id)
);

-- Enable RLS
ALTER TABLE public.driver_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin general can manage all driver payments"
ON public.driver_payments FOR ALL
USING (is_admin_general());

CREATE POLICY "Admin parroquia can manage driver payments in their parroquia"
ON public.driver_payments FOR ALL
USING (
    is_any_admin_parroquia() AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = driver_payments.driver_id 
        AND profiles.parroquia_id = get_admin_parroquia_id()
    )
);

CREATE POLICY "Drivers can view their own payment info"
ON public.driver_payments FOR SELECT
USING (driver_id = auth.uid());

CREATE POLICY "Drivers can update their own payment info"
ON public.driver_payments FOR UPDATE
USING (driver_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_driver_payments_updated_at
BEFORE UPDATE ON public.driver_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();