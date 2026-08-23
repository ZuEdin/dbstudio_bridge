import { BackendConfig, VirtualFile } from '../../../types/index';

export const generateDockerFiles = (config: BackendConfig, root: string, target: string): VirtualFile[] => {
    const files: VirtualFile[] = [];
    if (target === 'docker' || target === 'aws' || target === 'azure') {
        let dockerfileContent = '';
        
        if (config.language === 'dotnet') {
            let version = config.backendVersion || '9.0';
            if (parseFloat(version) > 9.0) {
                version = '9.0';
            }
            dockerfileContent = `# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:${version} AS build
WORKDIR /src
COPY ["Backend/${config.projectName}/${config.projectName}.csproj", "Backend/${config.projectName}/"]
RUN dotnet restore "Backend/${config.projectName}/${config.projectName}.csproj"
COPY . .
WORKDIR "/src/Backend/${config.projectName}"
RUN dotnet build "${config.projectName}.csproj" -c Release -o /app/build

# Publish Stage
FROM build AS publish
RUN dotnet publish "${config.projectName}.csproj" -c Release -o /app/publish

# Final Stage
FROM mcr.microsoft.com/dotnet/aspnet:${version} AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "${config.projectName}.dll"]
`;
        } else if (config.language === 'nodejs') {
            dockerfileContent = `FROM node:18-alpine
WORKDIR /app
COPY Backend/${config.projectName}/package*.json ./
RUN npm install --production
COPY Backend/${config.projectName}/ ./
EXPOSE ${config.port}
CMD ["node", "server.js"]`;
        } else if (config.language === 'php') {
            dockerfileContent = `FROM php:8.2-apache
RUN docker-php-ext-install pdo pdo_mysql
COPY Backend/${config.projectName}/ /var/www/html/
RUN a2enmod rewrite`;
        }

        files.push({
            name: 'Dockerfile',
            path: `${root}/Dockerfile`,
            content: dockerfileContent,
            language: 'text'
        });

        // Docker Compose (Full Stack)
        const composeContent = `version: '3.8'
services:
  api:
    build: .
    ports:
      - "${config.port}:${config.port}"
    environment:
      - ConnectionStrings__DefaultConnection=Server=db;Database=mydb;User=root;Password=example;
    depends_on:
      - db

  db:
    image: mysql:8.0
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: example
      MYSQL_DATABASE: mydb
    ports:
      - "3306:3306"
`;
        files.push({
            name: 'docker-compose.yml',
            path: `${root}/docker-compose.yml`,
            content: composeContent,
            language: 'text'
        });
    }
    return files;
};
