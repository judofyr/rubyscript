require "json"
require_relative "compiler"

dir = ARGV[0]
req = dir + '/request'
res = dir + '/response'

system("mkfifo", req) unless File.exists?(req)
system("mkfifo", res) unless File.exists?(res)

puts "Ready"
$stdout.flush

ISeq = RubyVM::InstructionSequence

while true
  r = JSON.load(File.read(req))
  File.open(res, 'w') do |f|
    begin
      c = RubyScript::YARV::Compiler.new

      if file = r["file"]
        iseq = ISeq.compile(File.read(file), file, ".", 1).to_a
        c.compile(iseq)
      end
      
      f << { 'code' => c.to_s }.to_json
    rescue
      f << { 'error' => $!.message }.to_json
    end
  end
end

