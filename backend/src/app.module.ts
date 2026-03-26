import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdemServicoFoto } from './ordens-servico/ordem-servico-foto.entity';
import { OrdemServico } from './ordens-servico/ordem-servico.entity';
import { OrdensServicoModule } from './ordens-servico/ordens-servico.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [OrdemServico, OrdemServicoFoto],
      synchronize: true,
    }),
    OrdensServicoModule,
  ],
})
export class AppModule {}
