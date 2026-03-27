import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agendamento } from './agendamentos/agendamento.entity';
import { AgendamentosModule } from './agendamentos/agendamentos.module';
import { GoogleCalendarToken } from './google-calendar/google-calendar-token.entity';
import { OrdemServicoFoto } from './ordens-servico/ordem-servico-foto.entity';
import { OrdemServico } from './ordens-servico/ordem-servico.entity';
import { OrdensServicoModule } from './ordens-servico/ordens-servico.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [
        OrdemServico,
        OrdemServicoFoto,
        Agendamento,
        GoogleCalendarToken,
      ],
      synchronize: true,
    }),
    OrdensServicoModule,
    AgendamentosModule,
  ],
})
export class AppModule {}
