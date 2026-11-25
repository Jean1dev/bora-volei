update public.jogos
set valor = round(valor * vagas, 2)
where valor is not null and valor > 0;

comment on column public.jogos.valor is
  'Aluguel total da quadra, em reais. Na interface, rateado pelos confirmados.';
