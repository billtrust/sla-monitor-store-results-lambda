FROM node:8.10

WORKDIR /app

COPY . .

RUN npm install -g serverless && \
    apt update && \
    apt install -y dos2unix && \
	dos2unix *.sh && \
	chmod +x *.sh

ENTRYPOINT ["/bin/bash"]