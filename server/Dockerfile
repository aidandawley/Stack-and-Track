# syntax=docker/dockerfile:1

# ---- Build the JAR ----
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package

# ---- Run stage ----
FROM eclipse-temurin:17-jre
WORKDIR /app

# copy the built jar (name is whatever your SNAPSHOT jar is)
COPY --from=build /app/target/*-SNAPSHOT.jar app.jar

# Render maps the port via $PORT
ENV PORT=8080
EXPOSE 8080

# Render will mount your secret at /etc/secrets/gcp-creds.json
ENV GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/gcp-creds.json

ENTRYPOINT ["java","-Dserver.port=${PORT}","-jar","/app/app.jar"]