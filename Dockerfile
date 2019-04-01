FROM node:8.10-stretch

WORKDIR /app

COPY . .

RUN npm install -g serverless && \
    npm install && \
    apt update && \
    apt install -y dos2unix jq && \
	dos2unix *.sh && \
	chmod +x *.sh

ENTRYPOINT ["/bin/bash"]