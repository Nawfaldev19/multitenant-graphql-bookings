# Limits failed sign-in attempts, per client IP and per email address, within a
# fixed window. Only failures count, so a person who signs in and out a lot is
# never blocked, while password guessing stops after a handful of tries.
#
# Counting per email as well as per IP stops a guesser who rotates addresses;
# the cost is that someone can lock a known email out for one window. The
# window is short and expires on its own, which we accept for this app.
#
# Counters live in a process-local memory store. That is correct for one Puma
# process; several processes or hosts would need a shared store (Solid Cache,
# Redis) passed in through `store=`.
class SignInThrottle
  MAX_FAILURES_PER_EMAIL = 5
  MAX_FAILURES_PER_IP = 20
  WINDOW = 15.minutes

  class << self
    attr_writer :store

    def store
      @store ||= ActiveSupport::Cache::MemoryStore.new
    end

    def blocked?(ip:, email:)
      failures(email_key(email)) >= MAX_FAILURES_PER_EMAIL || failures(ip_key(ip)) >= MAX_FAILURES_PER_IP
    end

    def record_failure(ip:, email:)
      [email_key(email), ip_key(ip)].each { |key| store.increment(key, 1, expires_in: WINDOW) }
    end

    def reset!
      store.clear
    end

    private

    def failures(key) = store.read(key, raw: true).to_i
    def email_key(email) = "sign_in:email:#{email.to_s.strip.downcase}"
    def ip_key(ip) = "sign_in:ip:#{ip}"
  end
end
