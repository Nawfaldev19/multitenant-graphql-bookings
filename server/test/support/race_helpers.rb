# Helpers for tests that run real concurrent transactions.
#
# Such tests set `use_transactional_tests = false`, because other threads cannot
# see rows inside an uncommitted test transaction, and they clean up after
# themselves with `delete_all_records`.
module RaceHelpers
  # Starts `count` threads that wait on one gate, so they reach the code under
  # test together. Each thread gets its own database connection and is given its
  # index; the block must load its own records, because Active Record objects
  # are not safe to share between threads. Returns each block's value.
  def run_concurrently(count)
    gate = Concurrent::CountDownLatch.new(1)
    threads = Array.new(count) do |index|
      Thread.new do
        gate.wait
        ActiveRecord::Base.connection_pool.with_connection { yield index }
      end
    end
    gate.count_down
    threads.map(&:value)
  end

  # Makes a private method sleep after it returns, for the duration of the block.
  # Placed between a check and the write that depends on it, this turns "the
  # race could happen" into "the race happens on every run", so a missing lock
  # fails the test reliably instead of occasionally.
  def with_widened_race_window(klass, method_name, seconds: 0.2)
    original = klass.instance_method(method_name)
    klass.define_method(method_name) { |*args, **kwargs, &block| original.bind_call(self, *args, **kwargs, &block).tap { sleep seconds } }
    klass.send(:private, method_name)
    yield
  ensure
    klass.define_method(method_name, original)
    klass.send(:private, method_name)
  end

  def delete_all_records
    TenantScoped.across_tenants do
      [AuditEvent, Reservation, Equipment, Membership, User, Organization].each(&:delete_all)
    end
  end

  # A fresh copy of the membership for the current thread, with its organization loaded.
  def reload_membership(membership)
    Membership.includes(:organization, :user).find(membership.id)
  end
end
