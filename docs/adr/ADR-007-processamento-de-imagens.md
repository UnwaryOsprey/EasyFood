# ADR-007: Processamento de Imagens dentro da API EasyFood

## Status
Aceita

## Data
01/11/2026

## Contexto
Os restaurantes passaram a cadastrar pratos no cardápio, e cada prato pode ter uma imagem. Imagens enviadas diretamente costumam ser grandes e prejudicam o desempenho e o consumo de dados. É preciso receber a imagem, reduzir seu tamanho e armazenar a versão otimizada.

## Alternativas Consideradas
1. **Processar dentro da API**: Multer recebe o arquivo e o Sharp o otimiza no próprio servidor Node.js.
2. **Serviço independente**: um serviço separado só para imagens. Isola a carga, mas exige mais infraestrutura e comunicação entre serviços.
3. **Serverless/FaaS**: uma função processa a imagem sob demanda. Escala bem, mas adiciona nova plataforma, configuração e custos.

## Decisão
Manter o processamento de imagens dentro da API EasyFood, em um serviço compartilhado (`shared/image.service.js`) e um middleware de upload (`shared/upload.middleware.js`).

## Justificativa
- **Simplicidade:** reutiliza a infraestrutura existente.
- **Baixo volume inicial** de imagens.
- **Facilidade de implementação** e menos componentes para configurar.
- **Contexto acadêmico** do projeto.
- O serviço fica em `shared` para ser reutilizado por outros módulos (logos, fotos de perfil) sem duplicar lógica.

## Consequências
### Vantagens
- Menor complexidade inicial.
- Menos componentes para configurar.
- Aproveitamento da infraestrutura existente.

### Limitações
- Consumo de CPU e memória da própria API durante o processamento.
- Possível impacto em outras requisições se muitas imagens chegarem ao mesmo tempo.
- Armazenamento local (`uploads/dishes/`) não serve para várias instâncias; em produção, avaliar armazenamento externo (como S3).
- Imagens públicas, sem controle de acesso.
- Necessidade de reavaliar a solução caso o volume cresça.

## Nota
Esta decisão não significa que Serverless seja inadequado. Significa que, neste momento, manter o processamento na API atende melhor às necessidades do projeto.
