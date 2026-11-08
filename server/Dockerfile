FROM ruby:3.3-slim

RUN apt-get update -qq \
  && apt-get install --no-install-recommends -y build-essential libyaml-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY Gemfile Gemfile.lock .ruby-version ./
RUN bundle config set --local path vendor/bundle && bundle install --jobs 4
COPY . .

EXPOSE 3000
# Development mode keeps the demo self-contained (no production secret needed).
CMD ["sh", "-c", "bin/rails db:prepare && bin/rails server -b 0.0.0.0 -p 3000"]
