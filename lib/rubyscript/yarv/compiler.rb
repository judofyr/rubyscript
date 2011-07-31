require "set"
require "json"

module RubyScript
  module YARV
    # Compiles YARV bytecode into JavaScript
    class Compiler
      class StackVar < Struct.new(:name, :compiler)
        def to_s
          compiler.used(self)
          name
        end
      end

      def initialize
        @buffer = []
        @sp = 0
        @ss = {}
        @unused_vars = Set.new
        @tmp = 0
      end

      def to_s; @buffer.join("\n") end
      def tmpid; "tmp#{@tmp += 1}" end
      def id_from_label(label) label.to_s[/\d+/] end

      def used(stack_var)
        @unused_vars.delete(stack_var)
      end

      def stack_pop
        var = StackVar.new("stack#{@sp -= 1}", self)
      ensure
        @unused_vars << var
      end

      def stack_push(expr)
        @unused_vars.each do |var|
          tmp = tmpid
          @buffer << "var #{tmp} = #{var}"
          var.name = tmp
        end

        @buffer << "stack#{@sp} = #{expr}"
      ensure
        @sp += 1
      end

      def js(obj)
        case obj
        when Symbol
          obj.to_s.to_json
        when String
          "str(#{obj.to_json})"
        when Integer
          obj.to_s
        when true, false
          obj.inspect
        else
          raise obj.inspect
        end
      end

      def compile(iseq)
        magic, major_version, minor_version, format_type, misc,
        name, filename, filepath, line_no, type, locals, args,
        catch_table, bytecode = iseq

        p args
        raise "can't handle advargs" unless args.is_a?(Integer)

        params = ['block']
        args.times do |i|
          params << "local#{misc[:local_size] - i}"
        end

        @buffer << "iseq = function iseq(#{params * ', '}) {"
        init = ["label = 0", "iseq"]

        misc[:stack_max].times do |i|
          init << "stack#{i}"
        end

        (1..(misc[:local_size] - args)).each do |i|
          init << "local#{i}"
        end

        @buffer << "var #{init.join(', ')};"

        @buffer << "while(1)"
        @buffer << "switch(label) {"
        @buffer << "case 0:"
        bytecode.each do |opcode|
          case opcode
          when Array
            send("on_#{opcode[0]}", *opcode[1..-1])
          when Symbol
            id = opcode.to_s[/\d+/]
            @buffer << "case #{id}:"
            if sp = @ss[opcode]
              @sp = sp
            else
              @ss[opcode] = @sp
            end
          end
        end
        @buffer << "default: throw 'You should not be here..'"
        @buffer << "}"
        @buffer << "}"
      end

      def on_trace(*) end
      def on_putnil; stack_push('null') end
      def on_putself; stack_push('this') end
      def on_putstring(str) stack_push(js str) end
      def on_putobject(obj) stack_push(js obj) end

      def on_putspecialobject(type)
        stack_push case type
        when 1
          'FrozenCore'
        when 2
          'cref.klass'
        when 3
          'cref_.klass'
        end
      end

      def on_putiseq(iseq)
        c = Compiler.new
        code = c.compile(iseq)
        @buffer << code
        stack_push('iseq')
      end

      def on_pop; @sp -= 1 end

      def on_setlocal(id)
        @buffer << "local#{id} = #{stack_pop}"
      end

      def on_getlocal(id)
        stack_push("local#{id}")
      end

      def on_getglobal(name)
        @buffer << "var res = globals[#{js name}]"
        @buffer << "if (res) res = res.value"
        stack_push('res')
      end

      def on_setglobal(name)
        value = stack_pop
        @buffer << <<-JS
          var res = globals[#{js name}];
          if (!res) {
            globals[#{js name}] = { value: #{value} }
          } else {
            res.value = #{value}
          }
        JS
      end

      def on_send(name, argc, block, flag, ic)
        if block
          c = Compiler.new
          code = c.compile(block)
          @buffer << code
          @buffer << "iseq.self = this"
        elsif flag & 4 > 0
          block = stack_pop
          @buffer << "iseq = #{block}"
        else
          @buffer << "iseq = null"
        end

        args = []
        argc.times { args.unshift(stack_pop) }

        recv = stack_pop
        recv = 'this' if flag & 8 > 0
        args.unshift('iseq')
        args.unshift(recv)

        meth = js :"meth_#{name}"
        @buffer << <<-JS
          var recv = #{recv}
          switch(typeof recv) {
            case 'object':
              if (recv === null) recv = NilProto;
              break;
            case 'number':
              recv = FixnumProto;
              break;
            case 'string':
              recv = SymbolProto;
              break;
            case 'boolean':
              recv = recv ? TrueProto : FalseProto;
              break;
            default:
              break;
          }
          var meth = recv[#{meth}] || lookup(recv.__super__, #{meth})
        JS
        stack_push("meth.call(#{args.join ', '})")
      end


      def on_branchunless(label)
        id = label.to_s[/\d+/]
        tmp = stack_pop
        @ss[label] = @sp
        @buffer << <<-JS
          if (#{tmp} === null || #{tmp} === false) {
            label = #{id};
            break;
          }
        JS
      end
      
      def on_branchif(label)
        id = label.to_s[/\d+/]
        tmp = stack_pop
        @ss[label] = @sp
        @buffer << <<-JS
          if (#{tmp} !== null || #{tmp} !== false) {
            label = #{id};
            break;
          }
        JS
      end

      def on_jump(label)
        id = label.to_s[/\d+/]
        @ss[label] = @sp
        @buffer << "label = #{id}; break"
      end

      def on_leave
        @buffer << "return #{stack_pop}"
      end

      def on_getinlinecache(label, num) end
      def on_setinlinecache(num) end

      def on_getconstant(name)
        stack_push "const_get(Object, #{js name});"
      end

      def on_setconstant(name)
        klass = stack_pop
        id = js :"const_#{name}"
        obj = stack_pop
        @buffer << "#{klass}.prototype[#{id}] = #{obj}"
      end

      {
        'plus'  => '+',
        'minus' => '-',
        'mult'  => '*',
        'div'   => '/',
        'lt'    => '<',
      }.each do |name, op|
        class_eval(<<-'RUBY' % [name, op])
        def on_opt_%s(ic)
          obj = stack_pop
          recv = stack_pop
          @buffer << <<-JS
          var res
            if  (typeof #{recv} === 'number' && typeof #{obj} === 'number') {
              res = #{recv} %s #{obj};
            } else {
              throw 'Should invoke regular method';
            }
          JS
          stack_push('res')
        end
        RUBY
      end
    end
  end
end

if $0 == __FILE__
  require "pp"
  $stderr, $stdout = $stdout, $stderr
  iseq = RubyVM::InstructionSequence.compile(ARGF.read, "src", ".", 1).to_a
  pp iseq.last

  compiler = RubyScript::YARV::Compiler.new
  code = compiler.compile(iseq)
  $stderr.puts code
end

