BOOTSTRAP_TESTS = FileList["test/bootstrap/*.rb"]

task :default => :test
task :test => 'test:bootstrap'

namespace :test do
  task :bootstrap do
    puts "Running bootstrap tests"
    puts
    fails = Hash.new(0)
    BOOTSTRAP_TESTS.each do |test|
      IO.popen("bin/rubyscript-node #{test}") do |io|
        io.each_line do |line|
          if line.strip != "ok"
            fails[test] += 1
            print 'F'
          else
            print '.'
          end
        end
      end
    end

    puts
    puts

    if fails.empty?
      puts "All bootstrap tests passed"
    else
      fails.each do |t, n|
        puts "#{n} failures in #{File.basename(t)}"
      end
    end
  end
end

