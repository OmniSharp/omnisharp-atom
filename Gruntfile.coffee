module.exports = (grunt) ->

    grunt.initConfig

        meta:
            src: 'lib/**/*.coffee',
            specs: 'spec/**/*.spec.js'

        watch:
            quality:
                files: [
                    '<%= meta.src %>'
                ]
                tasks: ['coffeelint']

        coffeelint:
            app: [
              'app/*.coffee'
              'scripts/*.coffee'
            ]

    grunt.loadNpmTasks 'grunt-contrib-watch'
    grunt.loadNpmTasks 'grunt-coffeelint'

    grunt.registerTask 'default', ['watch']

    return
