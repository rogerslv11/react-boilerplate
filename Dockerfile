# syntax = docker/dockerfile:1.7

# ----------------------------------------------------------------------------
# Stage 1: base — install Ruby and project gems
# ----------------------------------------------------------------------------
FROM ruby:3.3-slim-bookworm AS base

ENV BUNDLE_PATH=/usr/local/bundle \
    BUNDLE_JOBS=4 \
    BUNDLE_RETRY=3 \
    BUNDLE_WITHOUT='development:test' \
    LANG=C.UTF-8 \
    LC_ALL=C.UTF-8

RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        libyaml-dev \
        postgresql-client \
        curl \
        tini && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install gems first to leverage Docker layer caching
COPY Gemfile Gemfile.lock ./
RUN bundle config set --local path "${BUNDLE_PATH}" && \
    bundle install --jobs ${BUNDLE_JOBS} --retry ${BUNDLE_RETRY}

# ----------------------------------------------------------------------------
# Stage 2: dev — full toolchain, used for development with hot reload
# ----------------------------------------------------------------------------
FROM base AS dev

ENV BUNDLE_WITHOUT='' \
    APP_ENV=development

RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends git && \
    rm -rf /var/lib/apt/lists/*

COPY . .

EXPOSE 4567

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["bundle", "exec", "puma", "-C", "config/puma.rb", "-b", "tcp://0.0.0.0:4567"]

# ----------------------------------------------------------------------------
# Stage 3: prod — production image, runs as non-root, slim
# ----------------------------------------------------------------------------
FROM base AS prod

ENV APP_ENV=production \
    APP_HOST=0.0.0.0 \
    APP_PORT=4567 \
    RAILS_SERVE_STATIC_FILES=true

COPY . .

# Create non-root user
RUN groupadd --system --gid 1000 app && \
    useradd --system --uid 1000 --gid app --shell /bin/bash --create-home app && \
    chown -R app:app /app && \
    mkdir -p /app/tmp/pids /app/log && \
    chown -R app:app /app/tmp /app/log

USER app

EXPOSE 4567

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]

# ----------------------------------------------------------------------------
# Stage 4: test — runs the RSpec suite
# ----------------------------------------------------------------------------
FROM base AS test

ENV APP_ENV=test \
    BUNDLE_WITHOUT=''

RUN bundle config set --local without ''

COPY . .

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["bundle", "exec", "rspec"]