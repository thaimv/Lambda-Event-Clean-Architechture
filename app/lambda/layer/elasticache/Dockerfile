# Use Node.js 18 on Amazon Linux 2 (same as Lambda runtime)
FROM public.ecr.aws/lambda/nodejs:18

# Set working directory
WORKDIR /build

# Copy package files
COPY package.json package-lock.json* ./
COPY .npmrc ./

# Install dependencies in Linux environment with specific platform targeting
ENV npm_config_target_platform=linux
ENV npm_config_target_arch=x64
ENV npm_config_cache=/tmp/.npm

# Install dependencies
RUN npm ci --production --include=optional

# Force install Linux-specific valkey package
RUN npm install @valkey/valkey-glide-linux-x64-gnu --force --no-save || echo "npm install failed, will try manual download"

# Verify and manually download if needed
RUN if [ ! -f "node_modules/@valkey/valkey-glide-linux-x64-gnu/package.json" ]; then \
    echo "Manually downloading Linux package..."; \
    mkdir -p node_modules/@valkey/valkey-glide-linux-x64-gnu; \
    curl -f -L "https://registry.npmjs.org/@valkey/valkey-glide-linux-x64-gnu/-/valkey-glide-linux-x64-gnu-2.4.1.tgz" | tar -xz -C node_modules/@valkey/valkey-glide-linux-x64-gnu --strip-components=1 || \
    curl -f -L "https://registry.npmjs.org/@valkey/valkey-glide-linux-x64-gnu/-/valkey-glide-linux-x64-gnu-2.1.1.tgz" | tar -xz -C node_modules/@valkey/valkey-glide-linux-x64-gnu --strip-components=1 || \
    echo "Manual download also failed"; \
    fi

# Verify the installation
RUN ls -la node_modules/@valkey/ && \
    if [ -f "node_modules/@valkey/valkey-glide-linux-x64-gnu/package.json" ]; then \
        echo "Linux package successfully installed!"; \
        cat node_modules/@valkey/valkey-glide-linux-x64-gnu/package.json | head -10; \
    else \
        echo "Warning: Linux package not found"; \
    fi

# Create layer structure
RUN mkdir -p /opt/nodejs
RUN cp -r node_modules /opt/nodejs/

# Clean up unnecessary files to reduce size
RUN find /opt/nodejs/node_modules -name "*.md" -delete
RUN find /opt/nodejs/node_modules -name "*.txt" -delete
RUN find /opt/nodejs/node_modules -name "CHANGELOG*" -delete
RUN find /opt/nodejs/node_modules -name "HISTORY*" -delete
RUN find /opt/nodejs/node_modules -name "LICENSE*" -delete
RUN find /opt/nodejs/node_modules -name "NOTICE*" -delete
RUN find /opt/nodejs/node_modules -name "README*" -delete
RUN find /opt/nodejs/node_modules -name ".git*" -delete
RUN find /opt/nodejs/node_modules -name ".npm*" -delete
RUN find /opt/nodejs/node_modules -name "test*" -type d -exec rm -rf {} + 2>/dev/null || true
RUN find /opt/nodejs/node_modules -name "tests*" -type d -exec rm -rf {} + 2>/dev/null || true
RUN find /opt/nodejs/node_modules -name "example*" -type d -exec rm -rf {} + 2>/dev/null || true
RUN find /opt/nodejs/node_modules -name "examples*" -type d -exec rm -rf {} + 2>/dev/null || true
RUN find /opt/nodejs/node_modules -name "*.ts" -not -path "*/types/*" -delete 2>/dev/null || true
RUN find /opt/nodejs/node_modules -name "*.map" -delete 2>/dev/null || true

# Set consistent timestamps for better caching
RUN find /opt/nodejs -exec touch -d '1985-10-21 09:00:00' {} \;

# Create the final zip
WORKDIR /opt
RUN zip -rq /build/elasticache.zip nodejs/

CMD ["echo", "ElastiCache layer build complete"]
